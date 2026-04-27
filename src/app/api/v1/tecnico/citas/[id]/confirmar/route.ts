import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTecnico } from '@/lib/api-helpers'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const forbidden = await requireTecnico(session)
  if (forbidden) return forbidden

  const tecnicoId = session.user.id
  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id, tecnicoId },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  if (cita.confirmadoTecnico) {
    return NextResponse.json({ error: 'Esta cita ya fue confirmada' }, { status: 409 })
  }

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: { confirmadoTecnico: true },
  })

  return NextResponse.json({
    ok: true,
    confirmado_tecnico: citaActualizada.confirmadoTecnico,
  })
}