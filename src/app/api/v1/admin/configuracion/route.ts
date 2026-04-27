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

  const configs = await prisma.configuracionSistema.findMany()

  const map = configs.reduce((acc, c) => {
    acc[c.clave] = c.valor
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json({
    horario_atencion_inicio: map['horario_atencion_inicio'] || '09:00',
    horario_atencion_fin: map['horario_atencion_fin'] || '18:00',
    horario_atencion_dias: map['horario_atencion_dias']
      ? JSON.parse(map['horario_atencion_dias'])
      : [1, 2, 3, 4, 5],
  })
}

const configSchema = z.object({
  horario_atencion_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  horario_atencion_fin: z.string().regex(/^\d{2}:\d{2}$/),
  horario_atencion_dias: z.array(z.number().min(0).max(6)),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = configSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updates = [
    { clave: 'horario_atencion_inicio', valor: parsed.data.horario_atencion_inicio },
    { clave: 'horario_atencion_fin', valor: parsed.data.horario_atencion_fin },
    { clave: 'horario_atencion_dias', valor: JSON.stringify(parsed.data.horario_atencion_dias) },
  ]

  await prisma.$transaction(
    updates.map((u) =>
      prisma.configuracionSistema.upsert({
        where: { clave: u.clave },
        update: { valor: u.valor },
        create: { clave: u.clave, valor: u.valor },
      })
    )
  )

  return NextResponse.json({ ok: true })
}