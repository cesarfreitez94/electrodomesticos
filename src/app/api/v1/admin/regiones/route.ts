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

  const regiones = await prisma.region.findMany({
    include: {
      ciudades: {
        include: { _count: { select: { tecnicosCiudad: true } } },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(regiones.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    ciudades: r.ciudades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      habilitada: c.habilitada,
      suspendida: c.suspendida,
      tecnicos_count: c._count.tecnicosCiudad,
    })),
  })))
}

const regionSchema = z.object({ nombre: z.string().max(100) })

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = regionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const region = await prisma.region.create({
    data: { nombre: parsed.data.nombre },
  })

  return NextResponse.json({ id: region.id, nombre: region.nombre }, { status: 201 })
}