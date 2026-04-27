import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const updateSchema = z.object({
  nombre: z.string().max(150).optional(),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid().optional(),
  disponible: z.boolean().optional(),
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

  const repuesto = await prisma.repuesto.findUnique({ where: { id } })
  if (!repuesto) {
    return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nombre) data.nombre = parsed.data.nombre
  if (parsed.data.descripcion !== undefined) data.descripcion = parsed.data.descripcion
  if (parsed.data.categoria_id) data.categoriaId = parsed.data.categoria_id
  if (parsed.data.disponible !== undefined) data.disponible = parsed.data.disponible

  await prisma.repuesto.update({ where: { id }, data })

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

  await prisma.repuesto.update({ where: { id }, data: { disponible: false } })

  return NextResponse.json({ ok: true })
}