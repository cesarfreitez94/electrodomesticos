import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const updateSchema = z.object({
  nombre: z.string().max(150).optional(),
  precio: z.number().positive().optional(),
  atributos: z.array(z.object({
    id: z.string().uuid().optional(),
    nombre: z.string().max(100),
    tipo: z.enum(['texto', 'numero', 'seleccion']),
    opciones: z.array(z.string()).optional(),
  })).optional(),
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

  const subProducto = await prisma.subProducto.findUnique({ where: { id } })
  if (!subProducto) {
    return NextResponse.json({ error: 'Sub-producto no encontrado' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nombre) data.nombre = parsed.data.nombre
  if (parsed.data.precio) data.precio = parsed.data.precio

  await prisma.subProducto.update({ where: { id }, data })

  if (parsed.data.atributos) {
    await prisma.atributoSubProducto.deleteMany({ where: { subProductoId: id } })
    await prisma.atributoSubProducto.createMany({
      data: parsed.data.atributos.map((a) => ({
        subProductoId: id,
        nombre: a.nombre,
        tipo: a.tipo,
        opciones: a.opciones && a.opciones.length > 0 ? a.opciones : undefined,
      })),
    })
  }

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

  await prisma.subProducto.update({ where: { id }, data: { activo: false } })

  return NextResponse.json({ ok: true })
}