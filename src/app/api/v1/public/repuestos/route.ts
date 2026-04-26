import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const repuestos = await prisma.repuesto.findMany({
    where: { disponible: true },
    include: {
      categoria: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  const grouped = repuestos.reduce((acc, r) => {
    const catNombre = r.categoria.nombre
    if (!acc[catNombre]) acc[catNombre] = []
    acc[catNombre].push({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
    })
    return acc
  }, {} as Record<string, { id: string; nombre: string; descripcion: string | null }[]>)

  return NextResponse.json(grouped)
}