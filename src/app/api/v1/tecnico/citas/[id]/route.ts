import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTecnico } from '@/lib/api-helpers'

export async function GET(
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
    include: {
      servicio: { select: { nombre: true, precioMantenimiento: true } },
      ciudad: { select: { nombre: true } },
      repuestos: { include: { repuesto: { select: { nombre: true } } } },
    },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    id: cita.id,
    servicio: { nombre: cita.servicio.nombre, precio: Number(cita.servicio.precioMantenimiento) },
    ciudad: { nombre: cita.ciudad.nombre },
    cliente: {
      nombre: cita.clienteNombre,
      telefono: cita.clienteTelefono,
      direccion: cita.clienteDireccion,
    },
    fecha_hora: cita.fechaHora.toISOString(),
    estado: cita.estado,
    confirmado_tecnico: cita.confirmadoTecnico,
    repuestos: cita.repuestos.map((cr) => cr.repuesto.nombre),
  })
}