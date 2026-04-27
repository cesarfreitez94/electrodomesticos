import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const repuestos = await prisma.repuesto.findMany({
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    repuestos.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      categoria: r.categoria.nombre,
      disponible: r.disponible,
    }))
  )
}

const repuestoSchema = z.object({
  nombre: z.string().max(150),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid(),
  disponible: z.boolean().optional().default(true),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = repuestoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const repuesto = await prisma.repuesto.create({
    data: {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion,
      categoriaId: parsed.data.categoria_id,
      disponible: parsed.data.disponible,
    },
  })

  return NextResponse.json({ id: repuesto.id, nombre: repuesto.nombre }, { status: 201 })
}