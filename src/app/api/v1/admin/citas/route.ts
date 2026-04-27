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
  const fecha = searchParams.get('fecha')
  const tecnicoId = searchParams.get('tecnico_id')
  const estado = searchParams.get('estado')
  const ciudadId = searchParams.get('ciudad_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}

  if (fecha) {
    where.fechaHora = {
      gte: new Date(`${fecha}T00:00:00`),
      lt: new Date(`${fecha}T23:59:59`),
    }
  }

  if (tecnicoId) where.tecnicoId = tecnicoId
  if (estado) where.estado = estado
  if (ciudadId) where.ciudadId = ciudadId

  const [citas, total] = await Promise.all([
    prisma.cita.findMany({
      where,
      include: {
        servicio: { select: { nombre: true } },
        tecnico: { select: { id: true, nombre: true } },
        ciudad: { select: { nombre: true } },
      },
      orderBy: { fechaHora: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cita.count({ where }),
  ])

  return NextResponse.json({
    citas: citas.map((c) => ({
      id: c.id,
      servicio: c.servicio.nombre,
      tecnico: c.tecnico ? { id: c.tecnico.id, nombre: c.tecnico.nombre } : null,
      ciudad: c.ciudad.nombre,
      cliente_nombre: c.clienteNombre,
      cliente_email: c.clienteEmail,
      cliente_telefono: c.clienteTelefono,
      cliente_direccion: c.clienteDireccion,
      fecha_hora: c.fechaHora.toISOString(),
      estado: c.estado,
      confirmado_tecnico: c.confirmadoTecnico,
      notas_admin: c.notasAdmin,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}