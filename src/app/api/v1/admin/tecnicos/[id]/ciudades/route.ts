import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const ciudadesSchema = z.object({
  ciudad_ids: z.array(z.string().uuid()),
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
  const { ciudad_ids } = ciudadesSchema.parse(await req.json())

  await prisma.$transaction([
    prisma.tecnicoCiudad.deleteMany({ where: { tecnicoId: id } }),
    prisma.tecnicoCiudad.createMany({
      data: ciudad_ids.map((ciudadId) => ({ tecnicoId: id, ciudadId })),
    }),
  ])

  return NextResponse.json({ ok: true })
}