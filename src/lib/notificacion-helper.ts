import { prisma } from '@/lib/prisma'

export async function registrarNotificacionEnviada(
  tipo: string,
  destinatario: string,
  citaId?: string
) {
  await prisma.historialNotificacion.create({
    data: {
      citaId: citaId || null,
      tipo,
      destinatario,
      estado: 'enviado',
    },
  })
}

export async function registrarNotificacionFallida(
  tipo: string,
  destinatario: string,
  citaId: string | undefined,
  errorDetalle: string
) {
  await prisma.historialNotificacion.create({
    data: {
      citaId: citaId || null,
      tipo,
      destinatario,
      estado: 'fallido',
      errorDetalle,
    },
  })
}