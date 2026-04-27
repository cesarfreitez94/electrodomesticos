import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { enviarRecordatorio } from '@/lib/email-helpers'

async function ejecutarRecordatorios() {
  console.log('[Scheduler] Ejecutando recordatorios...')

  const ahora = new Date()

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

    const citas = await prisma.cita.findMany({
      where: {
        estado: 'confirmado',
        NOT: { estado: 'emergencia' },
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
      const yaEnviado = await prisma.historialNotificacion.findFirst({
        where: {
          citaId: cita.id,
          tipo: 'recordatorio',
          estado: 'enviado',
          enviadoAt: {
            gte: new Date(ahora.getTime() - 24 * 60 * 60 * 1000),
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
  cron.schedule('0 * * * *', async () => {
    try {
      await ejecutarRecordatorios()
    } catch (err) {
      console.error('[Scheduler] Error en ejecución:', err)
    }
  })

  console.log('[Scheduler] Inicializado — ejecutando cada hora en punto')
}