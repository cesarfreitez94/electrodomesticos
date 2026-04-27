import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const precioMasivoSchema = z.object({
  sub_producto_ids: z.array(z.string().uuid()).min(1),
  precio: z.number().positive(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = precioMasivoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  await prisma.subProducto.updateMany({
    where: { id: { in: parsed.data.sub_producto_ids } },
    data: { precio: parsed.data.precio },
  })

  return NextResponse.json({ ok: true, updated: parsed.data.sub_producto_ids.length })
}