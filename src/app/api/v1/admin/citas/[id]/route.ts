import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: {
      servicio: true,
      tecnico: { select: { id: true, nombre: true, email: true } },
      ciudad: { include: { region: true } },
      repuestos: { include: { repuesto: true } },
    },
  })

  if (!cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    id: cita.id,
    servicio: { id: cita.servicio.id, nombre: cita.servicio.nombre, precio: Number(cita.servicio.precioMantenimiento) },
    tecnico: cita.tecnico,
    ciudad: { id: cita.ciudad.id, nombre: cita.ciudad.nombre, region: cita.ciudad.region.nombre },
    cliente: {
      nombre: cita.clienteNombre,
      email: cita.clienteEmail,
      telefono: cita.clienteTelefono,
      direccion: cita.clienteDireccion,
    },
    fecha_hora: cita.fechaHora.toISOString(),
    estado: cita.estado,
    confirmado_tecnico: cita.confirmadoTecnico,
    notas_admin: cita.notasAdmin,
    repuestos: cita.repuestos.map((cr) => cr.repuesto.nombre),
    created_at: cita.createdAt.toISOString(),
  })
}