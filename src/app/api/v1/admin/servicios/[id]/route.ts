import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params

  const servicio = await prisma.servicio.findUnique({
    where: { id },
    include: {
      categoria: true,
      subProductos: {
        include: { atributos: true },
        where: { activo: true },
      },
    },
  })

  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: servicio.id,
    nombre: servicio.nombre,
    categoria: servicio.categoria.nombre,
    categoria_id: servicio.categoriaId,
    descripcion: servicio.descripcion,
    precio_mantenimiento: Number(servicio.precioMantenimiento),
    activo: servicio.activo,
    sub_productos: servicio.subProductos.map((sp) => ({
      id: sp.id,
      nombre: sp.nombre,
      precio: Number(sp.precio),
      atributos: sp.atributos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tipo: a.tipo,
        opciones: a.opciones,
      })),
    })),
  })
}

const updateSchema = z.object({
  nombre: z.string().max(150).optional(),
  categoria_id: z.string().uuid().optional(),
  descripcion: z.string().optional(),
  precio_mantenimiento: z.number().positive().optional(),
  activo: z.boolean().optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nombre) data.nombre = parsed.data.nombre
  if (parsed.data.categoria_id) data.categoriaId = parsed.data.categoria_id
  if (parsed.data.descripcion !== undefined) data.descripcion = parsed.data.descripcion
  if (parsed.data.precio_mantenimiento) data.precioMantenimiento = parsed.data.precio_mantenimiento
  if (parsed.data.activo !== undefined) data.activo = parsed.data.activo

  await prisma.servicio.update({ where: { id }, data })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params
  const servicio = await prisma.servicio.findUnique({ where: { id } })

  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  await prisma.servicio.update({ where: { id }, data: { activo: false } })

  return NextResponse.json({ ok: true })
}