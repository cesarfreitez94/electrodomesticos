import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { notificarCancelacionCliente } from '@/lib/email-helpers'

const estadoSchema = z.object({
  estado: z.enum(['confirmado', 'en_curso', 'completado', 'cancelado']),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = estadoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { servicio: true },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  const estadoAnterior = cita.estado

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: { estado: parsed.data.estado },
  })

  if (parsed.data.estado === 'cancelado' && estadoAnterior !== 'cancelado') {
    await notificarCancelacionCliente(citaActualizada, cita.servicio)
  }

  return NextResponse.json({ ok: true, estado: citaActualizada.estado })
}