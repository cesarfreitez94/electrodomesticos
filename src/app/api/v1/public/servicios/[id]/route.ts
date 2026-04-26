import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const servicio = await prisma.servicio.findUnique({
    where: { id, activo: true },
    include: {
      categoria: { select: { id: true, nombre: true } },
      subProductos: {
        where: { activo: true },
        include: {
          atributos: true,
        },
      },
    },
  })

  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: servicio.id,
    nombre: servicio.nombre,
    categoria: servicio.categoria.nombre,
    categoria_id: servicio.categoria.id,
    descripcion: servicio.descripcion,
    precio_mantenimiento: Number(servicio.precioMantenimiento),
    sub_productos: servicio.subProductos.map((sp) => ({
      id: sp.id,
      nombre: sp.nombre,
      precio: Number(sp.precio),
      atributos: sp.atributos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tipo: a.tipo,
        opciones: a.opciones,
      })),
    })),
  })
}