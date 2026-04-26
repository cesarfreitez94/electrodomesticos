import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const redes = await prisma.redSocial.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })

  return NextResponse.json(
    redes.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      url: r.url,
      icono: r.icono,
    }))
  )
}