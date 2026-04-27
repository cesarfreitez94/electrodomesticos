import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { enviarConfirmacionCliente, notificarTecnico } from '@/lib/email-helpers'

const tecnicoSchema = z.object({
  tecnico_id: z.string().uuid('ID de técnico inválido').nullable(),
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
  const parsed = tecnicoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { servicio: true, tecnico: true, ciudad: true },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  if (parsed.data.tecnico_id) {
    const tecnicoCiudad = await prisma.tecnicoCiudad.findFirst({
      where: {
        tecnicoId: parsed.data.tecnico_id,
        ciudadId: cita.ciudadId,
      },
    })

    if (!tecnicoCiudad) {
      return NextResponse.json(
        { error: 'El técnico no está asignado a esta ciudad' },
        { status: 422 }
      )
    }
  }

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: {
      tecnicoId: parsed.data.tecnico_id,
      estado: parsed.data.tecnico_id ? 'confirmado' : 'emergencia',
    },
    include: { tecnico: true, ciudad: true },
  })

  if (citaActualizada.tecnico) {
    await enviarConfirmacionCliente(citaActualizada, cita.servicio, cita.ciudad)
    await notificarTecnico(citaActualizada, cita.servicio, citaActualizada.tecnico, cita.ciudad)
  }

  return NextResponse.json({
    ok: true,
    tecnico_id: citaActualizada.tecnicoId,
    estado: citaActualizada.estado,
  })
}