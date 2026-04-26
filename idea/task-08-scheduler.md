# TASK-08 · Implementar scheduler de recordatorios con node-cron

> **Grupo funcional:** Scheduler
> **Referencia SDD:** § 1 (node-cron integrado en el proceso Next.js), § 5 (RN-07)
> **Referencia PRD:** RF-38 (recordatorios configurables), RF-36 (registro de notificaciones)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-08 — Scheduler de recordatorios |
| Estimación | S (2–4 horas) |
| Prioridad | Media — depende de TASK-07 (emails) |
| Tipo | Backend |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El scheduler corre cada hora con node-cron dentro del proceso Next.js. Busca citas en estado `confirmado` que deban recibir un recordatorio según las configuraciones activas en `configuracion_recordatorios`. Para cada configuración, calcula la ventana `(ahora + horas_antes - 30min, ahora + horas_antes + 30min)` y verifica que no se haya enviado ya ese recordatorio (consulta en `historial_notificaciones`). No envía recordatorios a citas en estado `emergencia`.

---

## Lo que hay que hacer

### 1. Crear `lib/scheduler.ts`

```typescript
import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { enviarRecordatorio } from '@/lib/email-helpers'

async function ejecutarRecordatorios() {
  console.log('[Scheduler] Ejecutando recordatorios...')

  const ahora = new Date()

  // Obtener configuraciones de recordatorio activas
  const configuraciones = await prisma.configuracionRecordatorio.findMany({
    where: { activo: true },
  })

  if (configuraciones.length === 0) {
    console.log('[Scheduler] No hay configuraciones de recordatorio activas')
    return
  }

  for (const config of configuraciones) {
    const ventanaInicio = new Date(ahora.getTime() + (config.horasAntes * 60 - 30) * 60 * 1000)
    const ventanaFin = new Date(ahora.getTime() + (config.horasAntes * 60 + 30) * 60 * 1000)

    // Buscar citas en estado confirmado dentro de la ventana
    const citas = await prisma.cita.findMany({
      where: {
        estado: 'confirmado',
        fechaHora: {
          gte: ventanaInicio,
          lt: ventanaFin,
        },
      },
      include: {
        servicio: true,
        ciudad: true,
      },
    })

    for (const cita of citas) {
      // Verificar que no se haya enviado ya este recordatorio
      const yaEnviado = await prisma.historialNotificacion.findFirst({
        where: {
          citaId: cita.id,
          tipo: 'recordatorio',
          estado: 'enviado',
          enviadoAt: {
            gte: new Date(ahora.getTime() - 24 * 60 * 60 * 1000), // solo últimas 24h
          },
        },
      })

      if (yaEnviado) {
        console.log(`[Scheduler] Recordatorio ya enviado para cita ${cita.id}, omitiendo`)
        continue
      }

      try {
        await enviarRecordatorio(cita, cita.servicio, cita.ciudad, config.horasAntes)
        console.log(`[Scheduler] Recordatorio enviado para cita ${cita.id}`)
      } catch (err) {
        console.error(`[Scheduler] Error al enviar recordatorio para cita ${cita.id}:`, err)
      }
    }
  }

  console.log('[Scheduler] Ejecución completada')
}

export function iniciarScheduler() {
  // Ejecutar cada hora en punto
  cron.schedule('0 * * * *', async () => {
    try {
      await ejecutarRecordatorios()
    } catch (err) {
      console.error('[Scheduler] Error en ejecución:', err)
    }
  })

  console.log('[Scheduler] Inicializado — ejecutando cada hora en punto')
}
```

### 2. Integrar el scheduler en Next.js

Crear o actualizar `app/layout.tsx` de la raíz para iniciar el scheduler solo en el servidor:

```typescript
import type { Metadata } from 'next'
import { InicializarScheduler } from '@/components/InicializarScheduler'

export const metadata: Metadata = {
  title: 'Plataforma de Mantenimiento',
  description: 'Sistema de gestión de servicios de mantenimiento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <InicializarScheduler />
        {children}
      </body>
    </html>
  )
}
```

Crear `components/InicializarScheduler.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { iniciarScheduler } from '@/lib/scheduler'

export function InicializarScheduler() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      iniciarScheduler()
    }
  }, [])

  return null
}
```

Opcionalmente, también se puede inicializar en un API route dedicado para quePM2 pueda hacer un reload sin afectar el scheduler:

Crear `app/api/scheduler/init/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { iniciarScheduler } from '@/lib/scheduler'

export const { GET } = handlers(async () => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 })
  }
  iniciarScheduler()
  return NextResponse.json({ status: 'Scheduler iniciado' })
})
```

### 3. Verificar que el scheduler compila

```bash
npm run build
```

### 4. Test manual del scheduler (opcional)

Para probar sin esperar 1 hora, ejecutar manualmente el job:

```typescript
// scripts/test-scheduler.ts
import { ejecutarRecordatorios } from '@/lib/scheduler'

ejecutarRecordatorios().then(() => {
  console.log('Done')
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Ejecutar con `npx tsx scripts/test-scheduler.ts`.

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] `lib/scheduler.ts` exporta `iniciarScheduler()`
- [ ] El scheduler ejecuta `ejecutarRecordatorios()` cada hora en punto (`0 * * * *`)
- [ ] Busca citas `confirmado` dentro de la ventana `(ahora + horas_antes ± 30min)`
- [ ] No envía recordatorios a citas en estado `emergencia`
- [ ] No envía recordatorios duplicados (verifica en `historial_notificaciones`)
- [ ] Registra cada envío en `historial_notificaciones` con `tipo=recordatorio`
- [ ] Si el envío falla, el error se registra pero no afecta otras citas
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-07 (emails — `enviarRecordatorio`) y TASK-02 (modelo de datos con `configuracion_recordatorios`)
- No bloquea otras tasks directamente — el scheduler es un proceso en segundo plano

---

## Notas para el ejecutor

- node-cron usa formato UTC por defecto. Si el servidor está en hora de Chile (UTC-4 / UTC-3), ajustar el cron expression o asegurar que las fechas en la BD están en UTC
- El scheduler corre dentro del proceso Next.js. Si PM2 reinicia el proceso, el scheduler se reinicia automáticamente
- Los recordatorios perdidos por fallo del scheduler no se recuperan en v1 (SDD § 6)
- La ventana de ±30min evita perder un recordatorio si el cron corre unos minutos tarde
- Solo se buscan envíos en las últimas 24h para evitar falsos positivos si se borran registros de `historial_notificaciones`

---

## Checklist de cierre

- [ ] Scheduler configurado para ejecutarse cada hora
- [ ] Ventana de ±30min en la búsqueda de citas
- [ ] Deduplicación de recordatorios por cita
- [ ] Citas en `emergencia` excluidas
- [ ] `npm run build` exitoso

---

*Fin de TASK-08. Siguiente: TASK-09 — UI del sitio público*