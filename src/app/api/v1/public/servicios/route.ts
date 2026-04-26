import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const servicios = await prisma.servicio.findMany({
    where: { activo: true },
    include: {
      categoria: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria.nombre,
      categoria_id: s.categoria.id,
      precio_mantenimiento: Number(s.precioMantenimiento),
      descripcion_breve: s.descripcion.substring(0, 120),
    }))
  )
}