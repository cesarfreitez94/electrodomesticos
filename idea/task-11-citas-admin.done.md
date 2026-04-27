# TASK-11 · Construir UI del backoffice Admin — Gestión de citas

> **Grupo funcional:** Backoffice — Gestión de citas
> **Referencia SDD:** § 4.1 (Endpoints GET/PATCH /api/v1/admin/citas), § 5 (RN-05)
> **Referencia PRD:** RF-31 (ver citas con filtros), RF-32 (cambiar estado), RF-33 (reasignar técnico)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-11 — Gestión de citas Admin |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea TASK-12 (calendario) |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El admin gestiona todas las citas desde una lista con filtros y un detalle de cita. Puede cambiar el estado (confirmado → en_curso → completado, o cancelar) y reasignar un técnico manualmente. También gestiona las emergencias asignándoles un técnico o cancelándolas. La lógica RN-05 aplica: al intentar deshabilitar un horario que ya tiene citas confirmadas, el sistema debe advertir.

---

## Lo que hay que hacer

### 1. API — Listar citas (GET `/api/v1/admin/citas`)

Crear `app/api/v1/admin/citas/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')
  const tecnicoId = searchParams.get('tecnico_id')
  const estado = searchParams.get('estado')
  const ciudadId = searchParams.get('ciudad_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = {}

  if (fecha) {
    where.fechaHora = {
      gte: new Date(`${fecha}T00:00:00`),
      lt: new Date(`${fecha}T23:59:59`),
    }
  }

  if (tecnicoId) where.tecnicoId = tecnicoId
  if (estado) where.estado = estado
  if (ciudadId) where.ciudadId = ciudadId

  const [citas, total] = await Promise.all([
    prisma.cita.findMany({
      where,
      include: {
        servicio: { select: { nombre: true } },
        tecnico: { select: { id: true, nombre: true } },
        ciudad: { select: { nombre: true } },
      },
      orderBy: { fechaHora: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cita.count({ where }),
  ])

  return NextResponse.json({
    citas: citas.map((c) => ({
      id: c.id,
      servicio: c.servicio.nombre,
      tecnico: c.tecnico ? { id: c.tecnico.id, nombre: c.tecnico.nombre } : null,
      ciudad: c.ciudad.nombre,
      cliente_nombre: c.clienteNombre,
      cliente_email: c.clienteEmail,
      cliente_telefono: c.clienteTelefono,
      cliente_direccion: c.clienteDireccion,
      fecha_hora: c.fechaHora.toISOString(),
      estado: c.estado,
      confirmado_tecnico: c.confirmadoTecnico,
      notas_admin: c.notasAdmin,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})
```

### 2. API — Detalle de cita (GET `/api/v1/admin/citas/:id`)

Crear `app/api/v1/admin/citas/[id]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'

export const { GET } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: {
      servicio: true,
      tecnico: { select: { id: true, nombre: true, email: true } },
      ciudad: { include: { region: true } },
      repuestos: { include: { repuesto: true } },
    },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    id: cita.id,
    servicio: { id: cita.servicio.id, nombre: cita.servicio.nombre, precio: Number(cita.servicio.precioMantenimiento) },
    tecnico: cita.tecnico,
    ciudad: { id: cita.ciudad.id, nombre: cita.ciudad.nombre, region: cita.ciudad.region.nombre },
    cliente: {
      nombre: cita.clienteNombre,
      email: cita.clienteEmail,
      telefono: cita.clienteTelefono,
      direccion: cita.clienteDireccion,
    },
    fecha_hora: cita.fechaHora.toISOString(),
    estado: cita.estado,
    confirmado_tecnico: cita.confirmadoTecnico,
    notas_admin: cita.notasAdmin,
    repuestos: cita.repuestos.map((cr) => cr.repuesto.nombre),
    created_at: cita.createdAt.toISOString(),
  })
})
```

### 3. API — Cambiar estado (PATCH `/api/v1/admin/citas/:id/estado`)

Crear `app/api/v1/admin/citas/[id]/estado/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'
import { notificarCancelacionCliente } from '@/lib/email-helpers'

const estadoSchema = z.object({
  estado: z.enum(['confirmado', 'en_curso', 'completado', 'cancelado']),
})

export const { PATCH } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params
  const body = await req.json()
  const parsed = estadoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { servicio: true },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  const estadoAnterior = cita.estado

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: { estado: parsed.data.estado },
  })

  // Si se cancela, enviar email al cliente
  if (parsed.data.estado === 'cancelado' && estadoAnterior !== 'cancelado') {
    await notificarCancelacionCliente(citaActualizada, cita.servicio)
  }

  return NextResponse.json({ ok: true, estado: citaActualizada.estado })
})
```

### 4. API — Asignar/reasignar técnico (PATCH `/api/v1/admin/citas/:id/tecnico`)

Crear `app/api/v1/admin/citas/[id]/tecnico/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'
import { enviarConfirmacionCliente, notificarTecnico } from '@/lib/email-helpers'

const tecnicoSchema = z.object({
  tecnico_id: z.string().uuid('ID de técnico inválido').nullable(),
})

export const { PATCH } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params
  const body = await req.json()
  const parsed = tecnicoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { servicio: true, tecnico: true, ciudad: true },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  // Validar que el nuevo técnico está habilitado en esa ciudad
  if (parsed.data.tecnico_id) {
    const tecnicoCiudad = await prisma.tecnicoCiudad.findFirst({
      where: {
        tecnicoId: parsed.data.tecnico_id,
        ciudadId: cita.ciudadId,
      },
    })

    if (!tecnicoCiudad) {
      return NextResponse.json(
        { error: 'El técnico no está asignado a esta ciudad' },
        { status: 422 }
      )
    }
  }

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: {
      tecnicoId: parsed.data.tecnico_id,
      estado: parsed.data.tecnico_id ? 'confirmado' : 'emergencia',
    },
    include: { tecnico: true, ciudad: true },
  })

  // Si se asignó un técnico, enviar confirmación
  if (citaActualizada.tecnico) {
    await enviarConfirmacionCliente(citaActualizada, cita.servicio, cita.ciudad)
    await notificarTecnico(citaActualizada, cita.servicio, citaActualizada.tecnico, cita.ciudad)
  }

  return NextResponse.json({
    ok: true,
    tecnico_id: citaActualizada.tecnicoId,
    estado: citaActualizada.estado,
  })
})
```

### 5. UI — Lista de citas `app/(admin)/citas/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ESTADOS = ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado', 'emergencia']

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-purple-100 text-purple-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  emergencia: 'bg-red-100 text-red-800',
}

export default function CitasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [citas, setCitas] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const estadoFilter = searchParams.get('estado') || ''
  const fechaFilter = searchParams.get('fecha') || ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (estadoFilter) params.set('estado', estadoFilter)
    if (fechaFilter) params.set('fecha', fechaFilter)
    params.set('page', String(page))

    setLoading(true)
    fetch(`/api/v1/admin/citas?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCitas(data.citas || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
  }, [page, estadoFilter, fechaFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Citas</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <Input
          type="date"
          value={fechaFilter}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.value) params.set('fecha', e.target.value)
            else params.delete('fecha')
            router.push(`/admin/citas?${params.toString()}`)
          }}
          className="w-40"
        />

        <Select
          value={estadoFilter}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString())
            if (v) params.set('estado', v)
            else params.delete('estado')
            router.push(`/admin/citas?${params.toString()}`)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{cita.cliente_nombre}</span>
                      <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
                      {cita.confirmado_tecnico && (
                        <Badge variant="outline">Técnico confirmó</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{cita.servicio} — {cita.ciudad}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(cita.fecha_hora).toLocaleString('es-CL')}
                    </p>
                    {cita.tecnico && (
                      <p className="text-sm text-gray-500">Técnico: {cita.tecnico.nombre}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/citas/${cita.id}`)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {citas.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay citas para los filtros seleccionados</p>
          )}
        </div>
      )}

      {/* Paginación */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Anterior
          </Button>
          <span className="px-4 py-2 text-sm">Página {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={citas.length < 20}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
```

### 6. UI — Detalle de cita `app/(admin)/citas/[id]/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export default function DetalleCitaPage() {
  const params = useParams()
  const router = useRouter()
  const [cita, setCita] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevoTecnico, setNuevoTecnico] = useState('')
  const [notasAdmin, setNotasAdmin] = useState('')
  const [guardando, setGuardando] = useState(false)

  const id = params.id as string

  useEffect(() => {
    fetch(`/api/v1/admin/citas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCita(data)
        setNuevoEstado(data.estado)
        setNotasAdmin(data.notas_admin || '')
      })

    // Obtener lista de técnicos para el selector
    fetch('/api/v1/admin/tecnicos')
      .then((r) => r.json())
      .then((data) => setTecnicos(data))
  }, [id])

  const cambiarEstado = async () => {
    if (!nuevoEstado) return
    setGuardando(true)
    const res = await fetch(`/api/v1/admin/citas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      setCita({ ...cita, estado: nuevoEstado })
    }
    setGuardando(false)
  }

  const asignarTecnico = async () => {
    setGuardando(true)
    const res = await fetch(`/api/v1/admin/citas/${id}/tecnico`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tecnico_id: nuevoTecnico || null }),
    })
    if (res.ok) {
      router.refresh()
    }
    setGuardando(false)
  }

  if (loading || !cita) return <p>Cargando...</p>

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_curso: 'bg-purple-100 text-purple-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-gray-100 text-gray-800',
    emergencia: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>← Volver</Button>
        <h1 className="text-2xl font-bold">Detalle de cita</h1>
        <Badge className={estadoColors[cita.estado]}>{cita.estado}</Badge>
        {cita.estado === 'emergencia' && (
          <span className="text-sm text-red-600 font-medium">
            ⚠️ Requiere acción del admin
          </span>
        )}
      </div>

      {/* Info del cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Nombre:</strong> {cita.cliente.nombre}</p>
          <p><strong>Email:</strong> {cita.cliente.email}</p>
          <p><strong>Teléfono:</strong> {cita.cliente.telefono}</p>
          <p><strong>Dirección:</strong> {cita.cliente.direccion}</p>
        </CardContent>
      </Card>

      {/* Info de la cita */}
      <Card>
        <CardHeader>
          <CardTitle>Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Servicio:</strong> {cita.servicio.nombre} — ${Number(cita.servicio.precio).toLocaleString('es-CL')}</p>
          <p><strong>Fecha y hora:</strong> {new Date(cita.fecha_hora).toLocaleString('es-CL')}</p>
          <p><strong>Ciudad:</strong> {cita.ciudad.nombre}</p>
          <p><strong>Región:</strong> {cita.ciudad.region}</p>
          {cita.repuestos.length > 0 && (
            <p><strong>Repuestos:</strong> {cita.repuestos.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Asignar técnico */}
      <Card>
        <CardHeader>
          <CardTitle>Técnico asignado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Actual: {cita.tecnico ? cita.tecnico.nombre : 'Ninguno'}
          </p>
          <div className="flex gap-4 items-center">
            <Select value={nuevoTecnico} onValueChange={setNuevoTecnico}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={asignarTecnico} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Asignar técnico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar estado */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de la cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['confirmado', 'en_curso', 'completado', 'cancelado'].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={cambiarEstado} disabled={guardando || nuevoEstado === cita.estado}>
              {guardando ? 'Guardando...' : 'Actualizar estado'}
            </Button>
          </div>
          {cita.confirmado_tecnico && (
            <p className="text-sm text-green-600">✓ El técnico confirmó esta cita</p>
          )}
        </CardContent>
      </Card>

      {/* Notas admin */}
      <Card>
        <CardHeader>
          <CardTitle>Notas del administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notasAdmin}
            onChange={(e) => setNotasAdmin(e.target.value)}
            placeholder="Notas internas..."
            rows={3}
          />
          <Button className="mt-2" variant="outline">
            Guardar notas
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 7. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET `/api/v1/admin/citas` lista citas con filtros por fecha, estado, técnico y ciudad
- [ ] GET `/api/v1/admin/citas/:id` retorna el detalle completo de la cita
- [ ] PATCH `/api/v1/admin/citas/:id/estado` cambia el estado y envía email si se cancela
- [ ] PATCH `/api/v1/admin/citas/:id/tecnico` asigna/reasigna técnico y valida que esté habilitado en la ciudad
- [ ] La lista de citas muestra filtros funcionales y paginación
- [ ] El detalle de cita muestra todos los campos editables
- [ ] Al asignar técnico a una cita en emergencia, el estado pasa a `confirmado` y se envía email al cliente y técnico
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 (modelo de datos y auth)
- Bloquea: TASK-12 (calendario admin) — comparte el layout del backoffice

---

## Notas para el ejecutor

- La página de detalle usa `'use client'` porque tiene interactividad (cambiar estado, asignar técnico)
- El layout del admin (`app/(admin)/layout.tsx`) ya fue creado en TASK-10 — no repetir
- Los filtros de la lista actualizan la URL con `router.push`, lo que causa re-render con los nuevos parámetros
- El selector de técnico solo muestra técnicos activos — se fetchean desde `/api/v1/admin/tecnicos` que se implementa en TASK-13

---

## Checklist de cierre

- [ ] API de listado con filtros funcionales
- [ ] API de detalle completo
- [ ] API de cambio de estado con email de cancelación
- [ ] API de asignación de técnico con validación
- [ ] UI de lista con filtros y paginación
- [ ] UI de detalle con cambio de estado y asignación de técnico
- [ ] `npm run build` exitoso

---

*Fin de TASK-11. Siguiente: TASK-12 — Calendario de disponibilidad del Admin*