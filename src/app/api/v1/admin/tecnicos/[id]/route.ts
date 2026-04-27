import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

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

  const tecnico = await prisma.user.findUnique({
    where: { id },
    include: {
      tecnicoCiudades: { include: { ciudad: { include: { region: true } } } },
    },
  })

  if (!tecnico || tecnico.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: tecnico.id,
    nombre: tecnico.nombre,
    email: tecnico.email,
    activo: tecnico.activo,
    ciudades: tecnico.tecnicoCiudades.map((tc) => ({ id: tc.ciudad.id, nombre: tc.ciudad.nombre, region: tc.ciudad.region.nombre })),
  })
}

const updateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
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

  const tecnico = await prisma.user.findUnique({ where: { id } })
  if (!tecnico || tecnico.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
  }

  if (parsed.data.email && parsed.data.email !== tecnico.email) {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 422 })
    }
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.nombre) data.nombre = parsed.data.nombre
  if (parsed.data.email) data.email = parsed.data.email
  if (parsed.data.activo !== undefined) data.activo = parsed.data.activo
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.update({ where: { id }, data })

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
  const tecnico = await prisma.user.findUnique({ where: { id } })

  if (!tecnico || tecnico.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id },
    data: { activo: false },
  })

  return NextResponse.json({ ok: true })
}