import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const servicioSchema = z.object({
  nombre: z.string().max(150),
  categoria_id: z.string().uuid(),
  descripcion: z.string(),
  precio_mantenimiento: z.number().positive(),
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
  const parsed = servicioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const categoria = await prisma.categoria.findUnique({ where: { id: parsed.data.categoria_id } })
  if (!categoria) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
  }

  const servicio = await prisma.servicio.create({
    data: {
      nombre: parsed.data.nombre,
      categoriaId: parsed.data.categoria_id,
      descripcion: parsed.data.descripcion,
      precioMantenimiento: parsed.data.precio_mantenimiento,
    },
  })

  return NextResponse.json({ id: servicio.id, nombre: servicio.nombre }, { status: 201 })
}