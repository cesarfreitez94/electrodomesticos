# TASK-10 · Construir UI del backoffice Admin — Dashboard de métricas

> **Grupo funcional:** Backoffice — Dashboard
> **Referencia SDD:** § 4.1 (Endpoint GET /api/v1/admin/dashboard), § 10 (Estructura de carpetas app/(admin)/dashboard/)
> **Referencia PRD:** RF-20 (dashboard con widgets), RF-84 (calendario de disponibilidad), RNF (responsive)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-10 — Dashboard Admin |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea TASK-11 (gestión de citas) |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El dashboard del admin muestra métricas clave de la operación: citas del día y semana, ingresos del período (citas completadas), tasa de ocupación, servicios más solicitados y tasa de cancelación. También muestra alertas de emergencias activas. La API está definida en el SDD § 4.1 (GET /api/v1/admin/dashboard). La UI se construye en `app/(admin)/dashboard/page.tsx`.

---

## Lo que hay que hacer

### 1. Crear endpoint GET `/api/v1/admin/dashboard`

Crear `app/api/v1/admin/dashboard/route.ts`:

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

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Citas de hoy
  const citasHoy = await prisma.cita.count({
    where: {
      fechaHora: { gte: startOfDay, lt: endOfDay },
    },
  })

  // Citas de la semana
  const citasSemana = await prisma.cita.count({
    where: {
      fechaHora: { gte: startOfWeek, lt: endOfDay },
    },
  })

  // Ingresos del período (solo citas completadas, solo precio del servicio)
  const citasCompletadas = await prisma.cita.findMany({
    where: {
      estado: 'completado',
      fechaHora: { gte: startOfMonth, lt: endOfDay },
    },
    include: { servicio: true },
  })

  const ingresosPeriodo = citasCompletadas.reduce(
    (sum, cita) => sum + Number(cita.servicio.precioMantenimiento),
    0
  )

  // Tasa de ocupación: citas en curso + confirmadas de hoy / horas disponibles hoy
  // Horas disponibles: 8 (9am a 6pm simplificado)
  const citasActivasHoy = await prisma.cita.count({
    where: {
      estado: { in: ['confirmado', 'en_curso'] },
      fechaHora: { gte: startOfDay, lt: endOfDay },
    },
  })
  const tasaOcupacion = Math.min(citasActivasHoy / 8, 1)

  // Servicios más solicitados (últimos 30 días)
  const serviciosTopRaw = await prisma.cita.groupBy({
    by: ['servicioId'],
    _count: { id: true },
    where: {
      fechaHora: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  const serviciosTop = await Promise.all(
    serviciosTopRaw.map(async (item) => {
      const servicio = await prisma.servicio.findUnique({ where: { id: item.servicioId } })
      return { nombre: servicio?.nombre || 'Desconocido', total: item._count.id }
    })
  )

  // Tasa de cancelación: canceladas / total en período
  const totalPeriodo = await prisma.cita.count({
    where: {
      fechaHora: { gte: startOfMonth, lt: endOfDay },
    },
  })
  const canceladasPeriodo = await prisma.cita.count({
    where: {
      estado: 'cancelado',
      fechaHora: { gte: startOfMonth, lt: endOfDay },
    },
  })
  const tasaCancelacion = totalPeriodo > 0 ? canceladasPeriodo / totalPeriodo : 0

  // Emergencias activas (sin técnico asignado)
  const emergenciasActivas = await prisma.cita.count({
    where: { estado: 'emergencia' },
  })

  return NextResponse.json({
    citas_hoy: citasHoy,
    citas_semana: citasSemana,
    ingresos_periodo: ingresosPeriodo,
    tasa_ocupacion: Math.round(tasaOcupacion * 100) / 100,
    tasa_cancelacion: Math.round(tasaCancelacion * 100) / 100,
    servicios_top: serviciosTop,
    emergencias_activas: emergenciasActivas,
  })
})
```

### 2. Crear API de métricas individuales (opcional, para widget lazy load)

Si los widgets van a recargar datos por separado, crear `/api/v1/admin/dashboard/metricas` con las mismas métricas. Si no, la única respuesta del dashboard es suficiente.

### 3. UI del dashboard `app/(admin)/dashboard/page.tsx`

Layout del backoffice en `app/(admin)/layout.tsx` (sidebar + header) se crea en TASK-13 como parte del CRUD de admin. Por ahora, usar un layout simple para que el dashboard funcione.

Crear `app/(admin)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any)?.rol !== 'admin') redirect('/tecnico/citas')

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
        <div className="p-6 font-bold text-xl">Panel Admin</div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink href="/admin/dashboard" label="Dashboard" />
          <SidebarLink href="/admin/citas" label="Citas" />
          <SidebarLink href="/admin/tecnicos" label="Técnicos" />
          <SidebarLink href="/admin/servicios" label="Servicios" />
          <SidebarLink href="/admin/repuestos" label="Repuestos" />
          <SidebarLink href="/admin/geografico" label="Regiones / Ciudades" />
          <SidebarLink href="/admin/calendario" label="Calendario" />
          <SidebarLink href="/admin/notificaciones" label="Notificaciones" />
          <SidebarLink href="/admin/configuracion" label="Configuración" />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-400 hover:text-white">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="bg-white border-b p-4 md:hidden flex items-center justify-between">
          <span className="font-bold">Panel Admin</span>
          <MobileMenu />
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      {label}
    </a>
  )
}

function MobileMenu() {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none">☰</summary>
      <div className="absolute right-0 top-full bg-gray-900 text-white rounded shadow p-4 space-y-2 min-w-40">
        <a href="/admin/dashboard" className="block">Dashboard</a>
        <a href="/admin/citas" className="block">Citas</a>
        <a href="/admin/tecnicos" className="block">Técnicos</a>
        <a href="/admin/servicios" className="block">Servicios</a>
      </div>
    </details>
  )
}
```

### 4. Página del dashboard `app/(admin)/dashboard/page.tsx`

```tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardWidgets } from '@/components/admin/DashboardWidgets'

async function getDashboardData() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [citasHoy, citasSemana, emergenciasActivas] = await Promise.all([
    prisma.cita.count({ where: { fechaHora: { gte: startOfDay, lt: endOfDay } } }),
    prisma.cita.count({ where: { fechaHora: { gte: startOfWeek, lt: endOfDay } } }),
    prisma.cita.count({ where: { estado: 'emergencia' } }),
  ])

  const serviciosTop = await prisma.cita.groupBy({
    by: ['servicioId'],
    _count: { id: true },
    where: { fechaHora: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  const serviciosTopNombres = await Promise.all(
    serviciosTop.map(async (s) => {
      const svc = await prisma.servicio.findUnique({ where: { id: s.servicioId } })
      return { nombre: svc?.nombre ?? 'N/A', total: s._count.id }
    })
  )

  const citasCompletadas = await prisma.cita.findMany({
    where: { estado: 'completado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
    include: { servicio: true },
  })

  const ingresos = citasCompletadas.reduce(
    (acc, c) => acc + Number(c.servicio.precioMantenimiento),
    0
  )

  const total = await prisma.cita.count({ where: { fechaHora: { gte: startOfMonth, lt: endOfDay } } })
  const canceladas = await prisma.cita.count({
    where: { estado: 'cancelado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
  })

  return {
    citas_hoy: citasHoy,
    citas_semana: citasSemana,
    ingresos_periodo: ingresos,
    tasa_ocupacion: 0, // se calcula con más datos
    tasa_cancelacion: total > 0 ? Math.round((canceladas / total) * 100) / 100 : 0,
    servicios_top: serviciosTopNombres,
    emergencias_activas: emergenciasActivas,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'admin') redirect('/login')

  const data = await getDashboardData()

  return <DashboardWidgets data={data} />
}
```

### 5. Componente DashboardWidgets `components/admin/DashboardWidgets.tsx`

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  citas_hoy: number
  citas_semana: number
  ingresos_periodo: number
  tasa_ocupacion: number
  tasa_cancelacion: number
  servicios_top: { nombre: string; total: number }[]
  emergencias_activas: number
}

export function DashboardWidgets({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {data.emergencias_activas > 0 && (
          <Badge variant="destructive" className="text-sm">
            {data.emergencias_activas} emergencia{data.emergencias_activas > 1 ? 's' : ''} activa{data.emergencias_activas > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Citas hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.citas_hoy}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Citas esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.citas_semana}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${data.ingresos_periodo.toLocaleString('es-CL')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tasa de cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.tasa_cancelacion * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servicios top */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios más solicitados (30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.servicios_top.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos aún</p>
          ) : (
            <ul className="space-y-2">
              {data.servicios_top.map((s, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{s.nombre}</span>
                  <Badge variant="secondary">{s.total}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Alerta emergencias */}
      {data.emergencias_activas > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-semibold">
            ⚠️ Hay {data.emergencias_activas} cita{data.emergencias_activas > 1 ? 's' : ''} en estado de emergencia que requieren acción.
          </p>
          <a href="/admin/citas?estado=emergencia" className="text-red-600 text-sm hover:underline mt-1 inline-block">
            Ver citas en emergencia →
          </a>
        </div>
      )}
    </div>
  )
}
```

### 6. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET `/api/v1/admin/dashboard` retorna JSON con todas las métricas (citas_hoy, citas_semana, ingresos_periodo, tasa_ocupacion, tasa_cancelacion, servicios_top, emergencias_activas)
- [ ] La página `/admin/dashboard` renderiza los 4 widgets de métricas
- [ ] Widget "Citas hoy" muestra el número correcto
- [ ] Widget "Ingresos del mes" muestra la suma de precios de servicios completados
- [ ] Widget "Servicios más solicitados" muestra el top 5 con nombres
- [ ] Si hay emergencias activas, se muestra alerta roja con link a la lista de emergencias
- [ ] `app/(admin)/layout.tsx` tiene sidebar funcional con todos los links de navegación
- [ ] En móvil el sidebar se convierte en menú hamburguesa
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01, TASK-02, TASK-03, TASK-04
- Bloquea: TASK-11 (gestión de citas) — comparte el layout del backoffice

---

## Notas para el ejecutor

- Los datos del dashboard se renderizan en Server Components (fetches directos a la BD). No usar TanStack Query en el admin dashboard — los Server Components ya hacen el fetch de forma eficiente
- Los valores de tasa de ocupación pueden ser 0 si no hay suficientes datos — esto es OK en early stage
- El layout del admin (`app/(admin)/layout.tsx`) es compartido por todas las pages del admin. Se refina en TASK-13 cuando se construyan las otras páginas del backoffice

---

## Checklist de cierre

- [ ] API dashboard retorna todas las métricas
- [ ] UI renderiza 4 widgets numéricos
- [ ] Widget servicios top muestra top 5
- [ ] Alerta de emergencias visible cuando hay emergencies
- [ ] Layout admin con sidebar y header
- [ ] `npm run build` exitoso

---

*Fin de TASK-10. Siguiente: TASK-11 — UI del backoffice Admin: Gestión de citas*