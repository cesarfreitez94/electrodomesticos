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

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(categorias.map((c) => ({ id: c.id, nombre: c.nombre })))
}

const categoriaSchema = z.object({
  nombre: z.string().max(100),
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
  const parsed = categoriaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const categoria = await prisma.categoria.create({
    data: { nombre: parsed.data.nombre },
  })

  return NextResponse.json({ id: categoria.id, nombre: categoria.nombre }, { status: 201 })
}