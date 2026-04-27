import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireTecnico } from '@/lib/api-helpers'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const forbidden = await requireTecnico(session)
  if (forbidden) return forbidden

  const tecnicoId = session.user.id

  const citas = await prisma.cita.findMany({
    where: { tecnicoId },
    include: {
      servicio: { select: { nombre: true } },
      ciudad: { select: { nombre: true } },
      repuestos: { include: { repuesto: { select: { nombre: true } } } },
    },
    orderBy: { fechaHora: 'asc' },
  })

  return NextResponse.json(
    citas.map((c) => ({
      id: c.id,
      servicio: c.servicio.nombre,
      ciudad: c.ciudad.nombre,
      cliente_nombre: c.clienteNombre,
      cliente_telefono: c.clienteTelefono,
      cliente_direccion: c.clienteDireccion,
      fecha_hora: c.fechaHora.toISOString(),
      estado: c.estado,
      confirmado_tecnico: c.confirmadoTecnico,
      repuestos: c.repuestos.map((cr) => cr.repuesto.nombre),
    }))
  )
}