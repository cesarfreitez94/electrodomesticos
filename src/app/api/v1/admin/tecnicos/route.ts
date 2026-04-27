import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

type UserWithRol = { rol?: string }

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const tecnicos = await prisma.user.findMany({
    where: { rol: 'tecnico' },
    include: {
      tecnicoCiudades: {
        include: { ciudad: { include: { region: true } } },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    tecnicos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      email: t.email,
      activo: t.activo,
      ciudades: t.tecnicoCiudades.map((tc) => ({
        id: tc.ciudad.id,
        nombre: tc.ciudad.nombre,
        region: tc.ciudad.region.nombre,
      })),
    }))
  )
}

const createSchema = z.object({
  nombre: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  ciudad_ids: z.array(z.string().uuid()).optional().default([]),
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
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 422 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  const tecnico = await prisma.user.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: 'tecnico',
      tecnicoCiudades: {
        create: parsed.data.ciudad_ids.map((ciudadId) => ({ ciudadId })),
      },
    },
    include: { tecnicoCiudades: { include: { ciudad: true } } },
  })

  return NextResponse.json({ id: tecnico.id, nombre: tecnico.nombre, email: tecnico.email }, { status: 201 })
}