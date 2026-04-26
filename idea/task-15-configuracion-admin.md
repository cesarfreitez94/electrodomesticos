# TASK-15 · Construir API + UI del backoffice Admin — Configuración (horario atención, recordatorios, redes sociales)

> **Grupo funcional:** Backoffice — Configuración
> **Referencia SDD:** § 4.1 (GET/PUT /api/v1/admin/configuracion, GET/POST/DELETE /api/v1/admin/recordatorios, GET/POST/PUT/DELETE /api/v1/admin/redes-sociales)
> **Referencia PRD:** RF-38 (configurar periodicidad recordatorios), RF-39 (horario de atención chat), RF-40 (redes sociales)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-15 — Configuración Admin |
| Estimación | S (2–4 horas) |
| Prioridad | Media |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El admin configura tres cosas desde el panel de configuración: (1) horario de atención del chat flotante (inicio, fin, días), (2) configuraciones de recordatorio (cuántas horas antes se envía), (3) enlaces de redes sociales visibles en el sitio público.

---

## Lo que hay que hacer

### 1. API — Configuración general (GET/PUT `/api/v1/admin/configuracion`)

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const configs = await prisma.configuracionSistema.findMany()

  const map = configs.reduce((acc, c) => {
    acc[c.clave] = c.valor
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json({
    horario_atencion_inicio: map['horario_atencion_inicio'] || '09:00',
    horario_atencion_fin: map['horario_atencion_fin'] || '18:00',
    horario_atencion_dias: map['horario_atencion_dias']
      ? JSON.parse(map['horario_atencion_dias'])
      : [1, 2, 3, 4, 5],
  })
})

const configSchema = z.object({
  horario_atencion_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  horario_atencion_fin: z.string().regex(/^\d{2}:\d{2}$/),
  horario_atencion_dias: z.array(z.number().min(0).max(6)),
})

export const { PUT } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const body = await req.json()
  const parsed = configSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updates = [
    { clave: 'horario_atencion_inicio', valor: parsed.data.horario_atencion_inicio },
    { clave: 'horario_atencion_fin', valor: parsed.data.horario_atencion_fin },
    { clave: 'horario_atencion_dias', valor: JSON.stringify(parsed.data.horario_atencion_dias) },
  ]

  await prisma.$transaction(
    updates.map((u) =>
      prisma.configuracionSistema.upsert({
        where: { clave: u.clave },
        update: { valor: u.valor },
        create: { clave: u.clave, valor: u.valor },
      })
    )
  )

  return NextResponse.json({ ok: true })
})
```

### 2. API — Recordatorios (GET/POST/DELETE `/api/v1/admin/recordatorios`)

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const recordatorios = await prisma.configuracionRecordatorio.findMany({
    orderBy: { horasAntes: 'asc' },
  })

  return NextResponse.json(
    recordatorios.map((r) => ({
      id: r.id,
      horas_antes: r.horasAntes,
      activo: r.activo,
    }))
  )
})

const recordatorioSchema = z.object({
  horas_antes: z.number().min(1).max(72),
  activo: z.boolean().optional().default(true),
})

export const { POST } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const body = await req.json()
  const parsed = recordatorioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existe = await prisma.configuracionRecordatorio.findFirst({
    where: { horasAntes: parsed.data.horas_antes },
  })

  if (existe) {
    return NextResponse.json(
      { error: 'Ya existe un recordatorio con esa configuración' },
      { status: 422 }
    )
  }

  const recordatorio = await prisma.configuracionRecordatorio.create({
    data: {
      horasAntes: parsed.data.horas_antes,
      activo: parsed.data.activo,
    },
  })

  return NextResponse.json({ id: recordatorio.id, horas_antes: recordatorio.horasAntes }, { status: 201 })
})

export const { DELETE } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params
  await prisma.configuracionRecordatorio.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
```

### 3. API — Redes sociales (GET/POST/PUT/DELETE `/api/v1/admin/redes-sociales`)

```typescript
export const { GET } = handlers(async () => {
  // Listar todas
})

export const { POST } = handlers(async (req) => {
  const redSchema = z.object({
    nombre: z.string().max(50),
    url: z.string().url(),
    icono: z.string().max(50).optional(),
    orden: z.number().optional().default(0),
    activo: z.boolean().optional().default(true),
  })

  const body = await req.json()
  const parsed = redSchema.safeParse(body)

  const red = await prisma.redSocial.create({ data: parsed.data })
  return NextResponse.json({ id: red.id }, { status: 201 })
})

export const { PUT } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const body = await req.json()

  const red = await prisma.redSocial.update({
    where: { id },
    data: body,
  })
  return NextResponse.json({ ok: true })
})

export const { DELETE } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  await prisma.redSocial.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
```

### 4. UI — Página de configuración `app/(admin)/configuracion/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function ConfiguracionPage() {
  // Estado para horario de atención
  const [horarioInicio, setHorarioInicio] = useState('09:00')
  const [horarioFin, setHorarioFin] = useState('18:00')
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5])

  // Estado para recordatorios
  const [recordatorios, setRecordatorios] = useState<any[]>([])
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState('')

  // Estado para redes sociales
  const [redes, setRedes] = useState<any[]>([])
  const [nuevaRed, setNuevaRed] = useState({ nombre: '', url: '', icono: '' })

  useEffect(() => {
    // Cargar configuración
    fetch('/api/v1/admin/configuracion')
      .then((r) => r.json())
      .then((data) => {
        setHorarioInicio(data.horario_atencion_inicio)
        setHorarioFin(data.horario_atencion_fin)
        setDiasSeleccionados(data.horario_atencion_dias)
      })

    fetch('/api/v1/admin/recordatorios')
      .then((r) => r.json())
      .then((data) => setRecordatorios(data))

    fetch('/api/v1/admin/redes-sociales')
      .then((r) => r.json())
      .then((data) => setRedes(data))
  }, [])

  const guardarHorario = async () => {
    await fetch('/api/v1/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horario_atencion_inicio: horarioInicio,
        horario_atencion_fin: horarioFin,
        horario_atencion_dias: diasSeleccionados,
      }),
    })
    alert('Horario guardado')
  }

  const agregarRecordatorio = async () => {
    const horas = parseInt(nuevoRecordatorio)
    if (!horas) return

    const res = await fetch('/api/v1/admin/recordatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horas_antes: horas }),
    })

    if (res.ok) {
      const data = await res.json()
      setRecordatorios([...recordatorios, { id: data.id, horas_antes: horas, activo: true }])
      setNuevoRecordatorio('')
    }
  }

  const eliminarRecordatorio = async (id: string) => {
    await fetch(`/api/v1/admin/recordatorios/${id}`, { method: 'DELETE' })
    setRecordatorios(recordatorios.filter((r) => r.id !== id))
  }

  const agregarRed = async () => {
    const res = await fetch('/api/v1/admin/redes-sociales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevaRed, orden: redes.length }),
    })
    if (res.ok) {
      const data = await res.json()
      setRedes([...redes, { id: data.id, ...nuevaRed, activo: true }])
      setNuevaRed({ nombre: '', url: '', icono: '' })
    }
  }

  const eliminarRed = async (id: string) => {
    await fetch(`/api/v1/admin/redes-sociales/${id}`, { method: 'DELETE' })
    setRedes(redes.filter((r) => r.id !== id))
  }

  const toggleDia = (dia: number) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter((d) => d !== dia))
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia].sort())
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Configuración</h1>

      {/* Horario de atención */}
      <Card>
        <CardHeader>
          <CardTitle>Horario de atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Configura el horario en que el chat flotante muestra "Disponible". Afuera de este horario muestra "Fuera de horario".
          </p>

          <div className="flex gap-4 items-center">
            <div className="space-y-1">
              <Label htmlFor="inicio">Inicio</Label>
              <Input
                id="inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fin">Fin</Label>
              <Input
                id="fin"
                type="time"
                value={horarioFin}
                onChange={(e) => setHorarioFin(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {DIAS.map((nombre, i) => (
              <button
                key={i}
                onClick={() => toggleDia(i)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  diasSeleccionados.includes(i)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>

          <Button onClick={guardarHorario}>Guardar horario</Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Recordatorios */}
      <Card>
        <CardHeader>
          <CardTitle>Recordatorios automáticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Define cuántos horas antes de la visita se envía un recordatorio al cliente.
          </p>

          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label>Horas antes</Label>
              <Input
                type="number"
                placeholder="Ej: 24"
                value={nuevoRecordatorio}
                onChange={(e) => setNuevoRecordatorio(e.target.value)}
                className="w-32"
                min={1}
                max={72}
              />
            </div>
            <Button onClick={agregarRecordatorio}>Agregar</Button>
          </div>

          <div className="space-y-2">
            {recordatorios.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span> {r.horas_antes} horas antes</span>
                <Button variant="ghost" size="sm" onClick={() => eliminarRecordatorio(r.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
            {recordatorios.length === 0 && (
              <p className="text-gray-400 text-sm">Sin recordatorios configurados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Redes sociales */}
      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Enlaces que aparecen en el footer del sitio público.
          </p>

          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                placeholder="Instagram"
                value={nuevaRed.nombre}
                onChange={(e) => setNuevaRed({ ...nuevaRed, nombre: e.target.value })}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input
                placeholder="https://instagram.com/..."
                value={nuevaRed.url}
                onChange={(e) => setNuevaRed({ ...nuevaRed, url: e.target.value })}
                className="w-64"
              />
            </div>
            <div className="space-y-1">
              <Label>Ícono</Label>
              <Input
                placeholder="instagram"
                value={nuevaRed.icono}
                onChange={(e) => setNuevaRed({ ...nuevaRed, icono: e.target.value })}
                className="w-32"
              />
            </div>
            <Button onClick={agregarRed}>Agregar</Button>
          </div>

          <div className="space-y-2">
            {redes.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {r.icono && <span className="text-lg">{r.icono}</span>}
                  <span className="font-medium">{r.nombre}</span>
                  <span className="text-sm text-gray-500">{r.url}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => eliminarRed(r.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5. Actualizar sidebar del admin layout

```tsx
<SidebarLink href="/admin/configuracion" label="Configuración" />
```

### 6. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET/PUT `/api/v1/admin/configuracion` permite leer y guardar horario de atención
- [ ] GET/POST/DELETE `/api/v1/admin/recordatorios` CRUD funcional
- [ ] GET/POST/PUT/DELETE `/api/v1/admin/redes-sociales` CRUD funcional
- [ ] La UI tiene las tres secciones: horario, recordatorios y redes sociales
- [ ] Los días del horario se togglean con botones tipo "chip"
- [ ] Los recordatorios muestran una lista con opción de eliminar
- [ ] Las redes sociales muestran nombre, URL e ícono
- [ ] El sidebar tiene link a "/admin/configuracion"
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-10 (layout del admin)
- No bloquea otras tasks — es la última del backoffice

---

## Notas para el ejecutor

- Para los íconos de redes sociales en el sitio público, se usa el nombre del ícono de Lucide React (ej: `instagram`, `facebook`, `twitter`). El campo `icono` en la BD almacena el nombre del ícono
- Los días de la semana se pasan como array JSON a la BD (`[1,2,3,4,5]` para Lunes a Viernes)
- El form de redes sociales es básico — en v2 se mejoraría con un componente de drag-and-drop para reordenar

---

## Checklist de cierre

- [ ] API de configuración horaria funcionando
- [ ] API de recordatorios CRUD
- [ ] API de redes sociales CRUD
- [ ] UI con tres secciones completas
- [ ] Link en sidebar
- [ ] `npm run build` exitoso

---

*Fin de TASK-15. Siguiente: TASK-16 — Portal técnico*