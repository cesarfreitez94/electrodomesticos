import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
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
}