import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { agendarSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { asignarTecnico } from '@/lib/asignacion-tecnico'
import { enviarConfirmacionCliente, notificarTecnico, notificarEmergenciaAdmin } from '@/lib/email-helpers'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = agendarSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  const ciudad = await prisma.ciudad.findUnique({
    where: { id: data.ciudad_id },
  })

  if (!ciudad || !ciudad.habilitada || ciudad.suspendida) {
    return NextResponse.json(
      { error: 'El servicio no está disponible en la ciudad seleccionada' },
      { status: 422 }
    )
  }

  const servicio = await prisma.servicio.findUnique({
    where: { id: data.servicio_id, activo: true },
  })

  if (!servicio) {
    return NextResponse.json(
      { error: 'Servicio no disponible' },
      { status: 422 }
    )
  }

  const disponibilidadResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/public/disponibilidad?ciudad_id=${data.ciudad_id}&fecha=${data.fecha_hora.split('T')[0]}`,
    { cache: 'no-store' }
  )
  const { slots } = await disponibilidadResponse.json()

  const hourStr = data.fecha_hora.split('T')[1].substring(0, 5)
  if (!slots.includes(hourStr)) {
    return NextResponse.json(
      { error: 'El horario seleccionado ya no está disponible. Por favor elige otro horario' },
      { status: 422 }
    )
  }

  const { tecnicoId, esEmergencia } = await asignarTecnico(data.ciudad_id, data.fecha_hora)

  const cita = await prisma.cita.create({
    data: {
      servicioId: data.servicio_id,
      tecnicoId: tecnicoId,
      ciudadId: data.ciudad_id,
      clienteNombre: data.cliente_nombre,
      clienteEmail: data.cliente_email,
      clienteTelefono: data.cliente_telefono,
      clienteDireccion: data.cliente_direccion,
      fechaHora: new Date(data.fecha_hora),
      estado: esEmergencia ? 'emergencia' : 'confirmado',
    },
  })

  if (data.repuesto_ids && data.repuesto_ids.length > 0) {
    await prisma.citaRepuesto.createMany({
      data: data.repuesto_ids.map((repuestoId) => ({
        citaId: cita.id,
        repuestoId,
      })),
    })
  }

  if (esEmergencia) {
    await notificarEmergenciaAdmin(cita, servicio, ciudad)
  } else if (tecnicoId) {
    await enviarConfirmacionCliente(cita, servicio, ciudad)
    const tecnico = await prisma.user.findUnique({ where: { id: tecnicoId } })
    if (tecnico) {
      await notificarTecnico(cita, servicio, tecnico, ciudad)
    }
  }

  return NextResponse.json(
    {
      cita_id: cita.id,
      estado: esEmergencia ? 'emergencia' : 'confirmado',
      mensaje: esEmergencia
        ? 'Tu solicitud fue recibida y será confirmada pronto'
        : 'Tu cita ha sido confirmada exitosamente',
    },
    { status: 201 }
  )
}