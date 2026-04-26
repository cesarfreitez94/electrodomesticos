# TASK-14 · Construir API + UI del backoffice Admin — Notificaciones

> **Grupo funcional:** Backoffice — Notificaciones
> **Referencia SDD:** § 4.1 (GET /api/v1/admin/notificaciones, GET /api/v1/admin/notificaciones/fallidas)
> **Referencia PRD:** RF-36 (historial de notificaciones), RF-37 (notificaciones fallidas)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-14 — Notificaciones Admin |
| Estimación | S (2–4 horas) |
| Prioridad | Media |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El admin revisa el historial de todas las notificaciones enviadas por el sistema (confirmaciones, notificaciones al técnico, recordatorios, cancelaciones, emergencias). Puede filtrar por estado (enviada/fallida) y ver el detalle del error cuando el estado es `fallido`. No hay reenvío automático en v1 — el admin decide qué acción tomar.

---

## Lo que hay que hacer

### 1. API — Listar notificaciones (GET `/api/v1/admin/notificaciones`)

Crear `app/api/v1/admin/notificaciones/route.ts`:

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
  const estado = searchParams.get('estado')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (estado === 'fallido') where.estado = 'fallido'
  else if (estado === 'enviado') where.estado = 'enviado'

  const [notificaciones, total] = await Promise.all([
    prisma.historialNotificacion.findMany({
      where,
      include: {
        cita: {
          select: {
            id: true,
            clienteNombre: true,
            clienteEmail: true,
            fechaHora: true,
            servicio: { select: { nombre: true } },
          },
        },
      },
      orderBy: { enviadoAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.historialNotificacion.count({ where }),
  ])

  return NextResponse.json({
    notificaciones: notificaciones.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      destinatario: n.destinatario,
      estado: n.estado,
      error_detalle: n.errorDetalle,
      enviado_at: n.enviadoAt.toISOString(),
      cita: n.cita
        ? {
            id: n.cita.id,
            cliente: n.cita.clienteNombre,
            email: n.cita.clienteEmail,
            fecha: n.cita.fechaHora.toISOString(),
            servicio: n.cita.servicio.nombre,
          }
        : null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})
```

### 2. API — Solo fallidas (GET `/api/v1/admin/notificaciones/fallidas`)

```typescript
export const { GET } = handlers(async (req) => {
  // Redirige al mismo endpoint con ?estado=fallido
  // O crea un handler separado que hace count de fallidas
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const fallidas = await prisma.historialNotificacion.findMany({
    where: { estado: 'fallido' },
    include: {
      cita: {
        select: {
          id: true,
          clienteNombre: true,
          clienteEmail: true,
          fechaHora: true,
          servicio: { select: { nombre: true } },
        },
      },
    },
    orderBy: { enviadoAt: 'desc' },
  })

  return NextResponse.json({
    notificaciones: fallidas.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      destinatario: n.destinatario,
      error_detalle: n.errorDetalle,
      enviado_at: n.enviadoAt.toISOString(),
      cita: n.cita
        ? {
            id: n.cita.id,
            cliente: n.cita.clienteNombre,
            fecha: n.cita.fechaHora.toISOString(),
            servicio: n.cita.servicio.nombre,
          }
        : null,
    })),
    total: fallidas.length,
  })
})
```

### 3. UI — Página de notificaciones `app/(admin)/notificaciones/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TIPO_LABELS: Record<string, string> = {
  confirmacion_cliente: 'Confirmación cliente',
  notif_tecnico: 'Notificación técnico',
  recordatorio: 'Recordatorio',
  cancelacion: 'Cancelación',
  emergencia_admin: 'Emergencia admin',
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'todas' | 'fallidas'>('todas')

  useEffect(() => {
    const url = tab === 'fallidas'
      ? '/api/v1/admin/notificaciones/fallidas'
      : '/api/v1/admin/notificaciones'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setNotificaciones(data.notificaciones || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
  }, [tab])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="fallidas">
            Fallidas
            {total > 0 && (
              <Badge variant="destructive" className="ml-2">{total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4">
          <ListaNotificaciones notificaciones={notificaciones} loading={loading} />
        </TabsContent>

        <TabsContent value="fallidas" className="mt-4">
          <ListaNotificaciones notificaciones={notificaciones} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ListaNotificaciones({ notificaciones, loading }: { notificaciones: any[]; loading: boolean }) {
  if (loading) return <p>Cargando...</p>
  if (notificaciones.length === 0) {
    return <p className="text-gray-500 text-center py-8">No hay notificaciones</p>
  }

  return (
    <div className="space-y-3">
      {notificaciones.map((n) => (
        <Card key={n.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={n.estado === 'fallido' ? 'destructive' : 'secondary'}>
                    {n.estado}
                  </Badge>
                  <span className="text-sm font-medium">
                    {TIPO_LABELS[n.tipo] || n.tipo}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Para: {n.destinatario}</p>
                {n.cita && (
                  <p className="text-sm text-gray-500">
                    {n.cita.cliente} — {n.cita.servicio} —{' '}
                    {new Date(n.cita.fecha).toLocaleString('es-CL')}
                  </p>
                )}
                {n.error_detalle && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                    <strong>Error:</strong> {n.error_detalle}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.enviado_at).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### 4. Actualizar sidebar del admin layout

En `app/(admin)/layout.tsx`:

```tsx
<SidebarLink href="/admin/notificaciones" label="Notificaciones" />
```

### 5. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET `/api/v1/admin/notificaciones` retorna historial paginado con todos los campos
- [ ] GET `/api/v1/admin/notificaciones/fallidas` retorna solo las fallidas
- [ ] La UI tiene tabs "Todas" y "Fallidas" con contador en "Fallidas"
- [ ] Cada notificación muestra: tipo, destinatario, estado, fecha
- [ ] Si el estado es `fallido`, muestra el detalle del error en rojo
- [ ] Si hay cita asociada, muestra el nombre del cliente, servicio y fecha
- [ ] El sidebar tiene link a "/admin/notificaciones"
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-10 (layout del admin)
- No bloquea otras tasks

---

## Notas para el ejecutor

- Los badges de shadcn (`variant="destructive"`) se importan desde `@/components/ui/badge`
- El Tab de shadcn se instala con: `npx shadcn@latest add tabs`
- No hay funcionalidad de "reenviar" en esta task — el admin gestiona los fallos manualmente打电话 o por otro canal

---

## Checklist de cierre

- [ ] API de listado con filtros funcionando
- [ ] API de fallidas funcionando
- [ ] UI con tabs y contador de fallidas
- [ ] Detalle de error visible en notificaciones fallidas
- [ ] Link en sidebar
- [ ] `npm run build` exitoso

---

*Fin de TASK-14. Siguiente: TASK-15 — Configuración del backoffice Admin (horario, recordatorios, redes sociales)*