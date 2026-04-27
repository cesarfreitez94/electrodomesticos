import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

type UserWithRol = { rol?: string }

const subProductoSchema = z.object({
  nombre: z.string().max(150),
  precio: z.number().positive(),
  atributos: z.array(z.object({
    nombre: z.string().max(100),
    tipo: z.enum(['texto', 'numero', 'seleccion']),
    opciones: z.array(z.string()).optional(),
  })).optional().default([]),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = subProductoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const subProducto = await prisma.subProducto.create({
    data: {
      servicioId: id,
      nombre: parsed.data.nombre,
      precio: parsed.data.precio,
      atributos: {
        create: parsed.data.atributos.map((a) => ({
          nombre: a.nombre,
          tipo: a.tipo,
          opciones: a.opciones && a.opciones.length > 0 ? a.opciones : undefined,
        })),
      },
    },
  })

  return NextResponse.json({ id: subProducto.id, nombre: subProducto.nombre }, { status: 201 })
}