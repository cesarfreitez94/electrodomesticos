import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

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
}