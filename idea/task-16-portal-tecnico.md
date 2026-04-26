# TASK-16 · Construir API + UI del portal técnico

> **Grupo funcional:** Portal técnico
> **Referencia SDD:** § 4.1 (GET/PATCH /api/v1/tecnico/citas), § 10 (app/(tecnico))
> **Referencia PRD:** RF-41 (autenticación técnico), RF-42 (ver citas asignadas), RF-43 (detalle de cita), RF-44 (confirmar comprensión)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-16 — Portal técnico |
| Estimación | S (2–4 horas) |
| Prioridad | Alta — bloquea TASK-18 (backups) |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El portal técnico es la vista mobile-first donde el técnico accede desde su móvil para ver sus citas asignadas del día, revisar el detalle (cliente, dirección, servicio, repuestos) y confirmar que entendió la cita. Solo ve sus propias citas — el API filtra por el `id` del usuario autenticado (RN-11).

---

## Lo que hay que hacer

### 1. API — Listar citas del técnico (GET `/api/v1/tecnico/citas`)

Crear `app/api/v1/tecnico/citas/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireTecnico } from '@/lib/api-helpers'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireTecnico(session)
  if (forbidden) return forbidden

  const tecnicoId = (session.user as any).id

  const citas = await prisma.cita.findMany({
    where: { tecnicoId },
    include: {
      servicio: { select: { nombre: true } },
      ciudad: { select: { nombre: true } },
      repuestos: { include: { repuesto: { select: { nombre: true } } } },
    },
    orderBy: { fechaHora: 'asc' },
  })

  return NextResponse.json(
    citas.map((c) => ({
      id: c.id,
      servicio: c.servicio.nombre,
      ciudad: c.ciudad.nombre,
      cliente_nombre: c.clienteNombre,
      cliente_telefono: c.clienteTelefono,
      cliente_direccion: c.clienteDireccion,
      fecha_hora: c.fechaHora.toISOString(),
      estado: c.estado,
      confirmado_tecnico: c.confirmadoTecnico,
      repuestos: c.repuestos.map((cr) => cr.repuesto.nombre),
    }))
  )
})
```

### 2. API — Detalle de cita (GET `/api/v1/tecnico/citas/:id`)

Crear `app/api/v1/tecnico/citas/[id]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireTecnico } from '@/lib/api-helpers'

export const { GET } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireTecnico(session)
  if (forbidden) return forbidden

  const tecnicoId = (session.user as any).id
  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id, tecnicoId },
    include: {
      servicio: { select: { nombre: true, precioMantenimiento: true } },
      ciudad: { select: { nombre: true } },
      repuestos: { include: { repuesto: { select: { nombre: true } } } },
    },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    id: cita.id,
    servicio: { nombre: cita.servicio.nombre, precio: Number(cita.servicio.precioMantenimiento) },
    ciudad: { nombre: cita.ciudad.nombre },
    cliente: {
      nombre: cita.clienteNombre,
      telefono: cita.clienteTelefono,
      direccion: cita.clienteDireccion,
    },
    fecha_hora: cita.fechaHora.toISOString(),
    estado: cita.estado,
    confirmado_tecnico: cita.confirmadoTecnico,
    repuestos: cita.repuestos.map((cr) => cr.repuesto.nombre),
  })
})
```

### 3. API — Confirmar comprensión (PATCH `/api/v1/tecnico/citas/:id/confirmar`)

Crear `app/api/v1/tecnico/citas/[id]/confirmar/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireTecnico } from '@/lib/api-helpers'

export const { PATCH } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireTecnico(session)
  if (forbidden) return forbidden

  const tecnicoId = (session.user as any).id
  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id, tecnicoId },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  if (cita.confirmadoTecnico) {
    return NextResponse.json({ error: 'Esta cita ya fue confirmada' }, { status: 409 })
  }

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: { confirmadoTecnico: true },
  })

  return NextResponse.json({
    ok: true,
    confirmado_tecnico: citaActualizada.confirmadoTecnico,
  })
})
```

### 4. Layout del portal técnico `app/(tecnico)/layout.tsx`

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function TecnicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any)?.rol !== 'tecnico') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">Portal Técnico</p>
          <p className="text-sm text-gray-500">{(session.user as any)?.nombre}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-500 hover:text-gray-700">Cerrar sesión</button>
        </form>
      </header>

      <main className="p-4">{children}</main>
    </div>
  )
}
```

### 5. Lista de citas `app/(tecnico)/citas/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-purple-100 text-purple-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  emergencia: 'bg-red-100 text-red-800',
}

export default function TecnicoCitasPage() {
  const router = useRouter()
  const [citas, setCitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/tecnico/citas')
      .then((r) => r.json())
      .then((data) => {
        setCitas(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center py-8">Cargando...</p>

  // Separar citas de hoy de las futuras
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)

  const citasHoy = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha >= hoy && fecha < manana
  })

  const citasProximas = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha >= manana
  })

  const citasPasadas = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha < hoy
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Mis citas</h1>

      {citasHoy.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Hoy</h2>
          <div className="space-y-3">
            {citasHoy.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} />
            ))}
          </div>
        </section>
      )}

      {citasProximas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Próximas</h2>
          <div className="space-y-3">
            {citasProximas.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} />
            ))}
          </div>
        </section>
      )}

      {citasPasadas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pasadas</h2>
          <div className="space-y-3">
            {citasPasadas.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} esPasada />
            ))}
          </div>
        </section>
      )}

      {citas.length === 0 && (
        <p className="text-center text-gray-500 py-8">No tienes citas asignadas</p>
      )}
    </div>
  )
}

function CitaCard({ cita, router, esPasada = false }: { cita: any; router: any; esPasada?: boolean }) {
  return (
    <Card className={esPasada ? 'opacity-60' : ''}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{cita.servicio}</p>
            <p className="text-sm text-gray-500">{cita.ciudad}</p>
          </div>
          <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
        </div>

        <div className="text-sm">
          <p>
            <span className="text-gray-500">Cliente:</span> {cita.cliente_nombre}
          </p>
          <p>
            <span className="text-gray-500">Dirección:</span> {cita.cliente_direccion}
          </p>
          <p>
            <span className="text-gray-500">Hora:</span>{' '}
            {new Date(cita.fecha_hora).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {cita.confirmado_tecnico && (
          <p className="text-sm text-green-600 font-medium">✓ Confirmada</p>
        )}

        {!esPasada && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push(`/tecnico/citas/${cita.id}`)}
          >
            Ver detalle
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### 6. Detalle de cita `app/(tecnico)/citas/[id]/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function DetalleCitaPage() {
  const params = useParams()
  const router = useRouter()
  const [cita, setCita] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  const id = params.id as string

  useEffect(() => {
    fetch(`/api/v1/tecnico/citas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCita(data)
        setLoading(false)
      })
  }, [id])

  const confirmar = async () => {
    setConfirmando(true)
    const res = await fetch(`/api/v1/tecnico/citas/${id}/confirmar`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      setCita({ ...cita, confirmado_tecnico: data.confirmado_tecnico })
    }
    setConfirmando(false)
  }

  if (loading || !cita) return <p className="text-center py-8">Cargando...</p>

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_curso: 'bg-purple-100 text-purple-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-gray-100 text-gray-800',
    emergencia: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        ← Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{cita.servicio.nombre}</CardTitle>
            <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fecha y hora */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold">
                {new Date(cita.fecha_hora).toLocaleDateString('es-CL', { day: '2-digit' })}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">
                {new Date(cita.fecha_hora).toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-gray-500">
                {new Date(cita.fecha_hora).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <Separator />

          {/* Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Cliente</h3>
            <p className="font-medium">{cita.cliente.nombre}</p>
            <a
              href={`tel:${cita.cliente.telefono}`}
              className="text-primary hover:underline text-sm"
            >
              {cita.cliente.telefono}
            </a>
          </div>

          <Separator />

          {/* Dirección */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Dirección</h3>
            <p>{cita.cliente.direccion}</p>
            <p className="text-sm text-gray-500">{cita.ciudad.nombre}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(cita.cliente.direccion + ', ' + cita.ciudad.nombre)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              Abrir en Google Maps →
            </a>
          </div>

          {/* Repuestos */}
          {cita.repuestos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Repuestos solicitados</h3>
                <ul className="list-disc list-inside text-sm">
                  {cita.repuestos.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Precio */}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Valor del servicio</span>
            <span className="font-semibold text-lg">
              ${cita.servicio.precio.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Confirmar */}
          {cita.estado !== 'completado' && cita.estado !== 'cancelado' && (
            <div className="pt-4">
              {cita.confirmado_tecnico ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-md text-center font-medium">
                  ✓ Has confirmado esta cita
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={confirmar}
                  disabled={confirmando}
                >
                  {confirmando ? 'Confirmando...' : 'Confirmar que entendí la cita'}
                </Button>
              )}
            </div>
          )}
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

- [ ] GET `/api/v1/tecnico/citas` retorna solo las citas del técnico autenticado (filtrado por tecnicoId)
- [ ] GET `/api/v1/tecnico/citas/:id` retorna 404 si la cita no pertenece al técnico autenticado
- [ ] PATCH `/api/v1/tecnico/citas/:id/confirmar` marca `confirmado_tecnico = true` y retorna 409 si ya estaba confirmada
- [ ] La lista de citas muestra citas de hoy, próximas y pasadas agrupadas
- [ ] El detalle de cita muestra toda la información + link a Google Maps
- [ ] El botón "Confirmar que entendí la cita" solo aparece si no está confirmada y el estado no es terminal
- [ ] El layout del portal técnico muestra el nombre del técnico y el botón de cerrar sesión
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01, TASK-02, TASK-03, TASK-04 (auth + modelo de datos)
- No bloquea tasks — es una de las últimas del proyecto

---

## Notas para el ejecutor

- El layout del portal técnico solo permite acceso a usuarios con `rol = tecnico`. Técnicos que intenten acceder a `/admin/*` son redirigidos (TASK-04)
- El filter por `tecnicoId` en el API es crítico: el técnico solo ve sus propias citas, no las de otros técnicos
- El link a Google Maps usa la dirección completa como query — puede no ser perfecto si hay caracteres especiales, pero funciona en la mayoría de casos
- Mobile-first: las páginas usan diseño vertical, fuentes grandes y botones completos para facilitar el uso con una mano

---

## Checklist de cierre

- [ ] API de listado filtrado por técnico autenticado
- [ ] API de detalle con verificación de propiedad
- [ ] API de confirmación con protección de doble-confirmación
- [ ] UI de lista con agrupación (hoy, próximas, pasadas)
- [ ] UI de detalle con toda la info y link a Maps
- [ ] Layout con header y logout
- [ ] `npm run build` exitoso

---

*Fin de TASK-16. Siguiente: TASK-17 — SEO, performance y seguridad*