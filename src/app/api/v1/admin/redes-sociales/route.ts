import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const redes = await prisma.redSocial.findMany({
    orderBy: { orden: 'asc' },
  })

  return NextResponse.json(
    redes.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      url: r.url,
      icono: r.icono,
      orden: r.orden,
      activo: r.activo,
    }))
  )
}

const redSchema = z.object({
  nombre: z.string().max(50),
  url: z.string().url(),
  icono: z.string().max(50).optional(),
  orden: z.number().optional().default(0),
  activo: z.boolean().optional().default(true),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = redSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const red = await prisma.redSocial.create({ data: parsed.data })
  return NextResponse.json({ id: red.id }, { status: 201 })
}