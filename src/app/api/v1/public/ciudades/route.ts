import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const ciudades = await prisma.ciudad.findMany({
    where: {
      habilitada: true,
      suspendida: false,
    },
    include: {
      region: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    ciudades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      region: c.region.nombre,
      region_id: c.region.id,
    }))
  )
}