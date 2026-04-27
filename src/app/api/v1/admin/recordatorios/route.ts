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

  const recordatorios = await prisma.configuracionRecordatorio.findMany({
    orderBy: { horasAntes: 'asc' },
  })

  return NextResponse.json(
    recordatorios.map((r) => ({
      id: r.id,
      horas_antes: r.horasAntes,
      activo: r.activo,
    }))
  )
}

const recordatorioSchema = z.object({
  horas_antes: z.number().min(1).max(72),
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
  const parsed = recordatorioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existe = await prisma.configuracionRecordatorio.findFirst({
    where: { horasAntes: parsed.data.horas_antes },
  })

  if (existe) {
    return NextResponse.json(
      { error: 'Ya existe un recordatorio con esa configuración' },
      { status: 422 }
    )
  }

  const recordatorio = await prisma.configuracionRecordatorio.create({
    data: {
      horasAntes: parsed.data.horas_antes,
      activo: parsed.data.activo,
    },
  })

  return NextResponse.json({ id: recordatorio.id, horas_antes: recordatorio.horasAntes }, { status: 201 })
}