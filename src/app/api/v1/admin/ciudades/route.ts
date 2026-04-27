import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const ciudadSchema = z.object({
  nombre: z.string().max(100),
  region_id: z.string().uuid(),
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
  const parsed = ciudadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const region = await prisma.region.findUnique({ where: { id: parsed.data.region_id } })
  if (!region) {
    return NextResponse.json({ error: 'Región no encontrada' }, { status: 404 })
  }

  const ciudad = await prisma.ciudad.create({
    data: {
      nombre: parsed.data.nombre,
      regionId: parsed.data.region_id,
    },
  })

  return NextResponse.json({ id: ciudad.id, nombre: ciudad.nombre }, { status: 201 })
}