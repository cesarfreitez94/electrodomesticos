# TASK-12 · Construir UI del backoffice Admin — Calendario de disponibilidad

> **Grupo funcional:** Backoffice — Calendario
> **Referencia SDD:** § 4.1 (GET/PUT /api/v1/admin/disponibilidad), § 5 (RN-05, RN-14), § 10 (FullCalendar)
> **Referencia PRD:** RF-27 (configurar calendario), RF-28 (franjas horarias), RF-29 (replicar al mes)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-12 — Calendario de disponibilidad Admin |
| Estimación | M (4–8 horas) |
| Prioridad | Media |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El admin configura la disponibilidad horaria semanal. Cada día de la semana (Lunes-Domingo) tiene franjas horarias activas. El sistema replica automáticamente la configuración de un día al resto del mismo día de la semana en el mes (RN-14). RN-05 aplica: si se intenta deshabilitar un horario que ya tiene citas en estado `confirmado` o `en_curso`, el sistema muestra una advertencia.

---

## Lo que hay que hacer

### 1. API — Obtener disponibilidad (GET `/api/v1/admin/disponibilidad`)

Crear `app/api/v1/admin/disponibilidad/route.ts`:

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

  const franjas = await prisma.disponibilidadCalendario.findMany({
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  })

  return NextResponse.json({
    franjas: franjas.map((f) => ({
      id: f.id,
      dia_semana: f.diaSemana,
      hora_inicio: f.horaInicio,
      hora_fin: f.horaFin,
      activo: f.activo,
    })),
  })
})
```

### 2. API — Guardar disponibilidad (PUT `/api/v1/admin/disponibilidad`)

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'
import { verificarCitasEnFranja } from '@/lib/disponibilidad'

const disponibilidadSchema = z.object({
  franjas: z.array(z.object({
    id: z.string().uuid().optional(),
    dia_semana: z.number().min(0).max(6),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato hora inválido (HH:MM)'),
    hora_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato hora inválido (HH:MM)'),
    activo: z.boolean(),
  })),
})

export const { PUT } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const body = await req.json()
  const parsed = disponibilidadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Para franjas que se están deshabilitando, verificar si hay citas afectadas (RN-05)
  const franjasDeshabilitando = parsed.data.franjas.filter((f) => !f.activo && f.id)
  const advertencias: string[] = []

  for (const franja of franjasDeshabilitando) {
    const franjasBD = await prisma.disponibilidadCalendario.findMany({
      where: { id: franja.id, activo: true },
    })

    for (const fb of franjasBD) {
      const count = await verificarCitasEnFranja(fb.diaSemana, fb.horaInicio, fb.horaFin)
      if (count > 0) {
        advertencias.push(
          `La franja ${fb.horaInicio}-${fb.horaFin} del día ${fb.diaSemana} tiene ${count} cita(s) confirmadas.`
        )
      }
    }
  }

  // Reemplazar toda la disponibilidad (DELETE + INSERT en transacción)
  await prisma.$transaction(async (tx) => {
    // Eliminar todas las franjas existentes
    await tx.disponibilidadCalendario.deleteMany({})

    // Crear las nuevas
    if (parsed.data.franjas.length > 0) {
      await tx.disponibilidadCalendario.createMany({
        data: parsed.data.franjas.map((f) => ({
          diaSemana: f.dia_semana,
          horaInicio: f.hora_inicio,
          horaFin: f.hora_fin,
          activo: f.activo,
        })),
      })
    }
  })

  return NextResponse.json({
    ok: true,
    franjas_count: parsed.data.franjas.length,
    advertencias: advertencias.length > 0 ? advertencias : undefined,
  })
})
```

### 3. UI — Página del calendario `app/(admin)/calendario/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Franja {
  id?: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

export default function CalendarioPage() {
  const [franjas, setFranjas] = useState<Franja[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/v1/admin/disponibilidad')
      .then((r) => r.json())
      .then((data) => {
        setFranjas(data.franjas || [])
        setLoading(false)
      })
  }, [])

  // Inicializar franjas por día (una franja por defecto deshabilitada por día)
  const initFranjas = (): Franja[] => {
    return DIAS.map((_, i) => {
      const existente = franjas.filter((f) => f.dia_semana === i)
      if (existente.length > 0) return existente[0]
      return { dia_semana: i, hora_inicio: '09:00', hora_fin: '18:00', activo: false }
    })
  }

  const [franjasEditando, setFranjasEditando] = useState<Franja[]>([])

  useEffect(() => {
    if (!loading) {
      setFranjasEditando(initFranjas())
    }
  }, [loading])

  const actualizarFranja = (index: number, campo: keyof Franja, valor: any) => {
    setFranjasEditando((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [campo]: valor }
      return next
    })
  }

  const guardar = async () => {
    setGuardando(true)
    const res = await fetch('/api/v1/admin/disponibilidad', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ franjas: franjasEditando }),
    })
    const data = await res.json()

    if (res.ok) {
      setMensaje({
        type: data.advertencias ? 'warn' : 'ok',
        text: data.advertencias
          ? `Guardado. ${data.advertencias.length} advertencia(s) sobre citas existentes.`
          : 'Configuración guardada correctamente.',
      })
      if (!data.advertencias) {
        setFranjas(franjasEditando)
      }
    } else {
      setMensaje({ type: 'warn', text: 'Error al guardar' })
    }
    setGuardando(false)
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de disponibilidad</h1>
      </div>

      <p className="text-sm text-gray-600">
        Configura los horarios disponibles para cada día de la semana. Los cambios afectan la disponibilidad visible para los clientes al agendar.
      </p>

      {mensaje && (
        <div className={`p-4 rounded-md ${mensaje.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
          {mensaje.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Horarios por día</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Día</TableHead>
                <TableHead>Hora inicio</TableHead>
                <TableHead>Hora fin</TableHead>
                <TableHead className="w-24">Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franjasEditando.map((franja, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <span className="font-medium">{DIAS[franja.dia_semana]}</span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={franja.hora_inicio}
                      onChange={(e) => actualizarFranja(i, 'hora_inicio', e.target.value)}
                      className="w-32"
                      disabled={!franja.activo}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={franja.hora_fin}
                      onChange={(e) => actualizarFranja(i, 'hora_fin', e.target.value)}
                      className="w-32"
                      disabled={!franja.activo}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={franja.activo}
                      onChange={(e) => actualizarFranja(i, 'activo', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replicar al resto del mes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            La configuración de cada día se aplica automáticamente a todas las semanas del mes para el mismo día de la semana. No es necesario replicar manualmente — el sistema lo calcula dinámicamente al mostrar disponibilidad.
          </p>
          <div className="bg-blue-50 rounded-md p-4 text-sm text-blue-800">
            ℹ️ El sistema calcula la disponibilidad dinámicamente combinando las franjas configuradas con las citas existentes. No almacena slots por fecha individual.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}
```

### 4. Actualizar sidebar del admin layout para incluir el link a calendario

En `app/(admin)/layout.tsx` (creado en TASK-10), agregar el link de calendario:

```tsx
<SidebarLink href="/admin/calendario" label="Calendario" />
```

### 5. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET `/api/v1/admin/disponibilidad` retorna todas las franjas configuradas
- [ ] PUT `/api/v1/admin/disponibilidad` reemplaza la configuración completa
- [ ] Si se deshabilita una franja con citas confirmadas, retorna advertencia en la respuesta
- [ ] La UI muestra tabla con 7 filas (Lunes-Domingo), hora inicio, hora fin, checkbox activo
- [ ] Los campos de hora están deshabilitados si el día no está activo
- [ ] Al guardar, la UI muestra mensaje de éxito o advertencia
- [ ] El sidebar del admin tiene link a "/admin/calendario"
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-10 (layout del admin)
- No bloquea otras tasks directamente — el calendario es independiente

---

## Notas para el ejecutor

- La replicación al resto del mes (RN-14) es cálculo dinámico, no almacenamiento. No se genera una franja por cada fecha — el sistema calcula disponibilidad en tiempo real combinando `disponibilidad_calendario` + citas existentes
- `verificarCitasEnFranja` de `lib/disponibilidad.ts` (TASK-06) se usa para la advertencia de RN-05
- FullCalendar (mencionado en el stack del SDD) se usa en v2 para una vista visual del calendario. En v1, la tabla simple es suficiente para configurar la disponibilidad

---

## Checklist de cierre

- [ ] API GET/PUT disponibilidad funcional
- [ ] UI con tabla de 7 días y campos de hora
- [ ] Checkboxes activos/inactivos
- [ ] Advertencia cuando se deshabilita franja con citas
- [ ] Mensaje de éxito/advertencia tras guardar
- [ ] `npm run build` exitoso

---

*Fin de TASK-12. Siguiente: TASK-13 — CRUDs del backoffice Admin (técnicos, servicios, repuestos, categorías, regiones/ciudades)*