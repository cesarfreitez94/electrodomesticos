import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { verificarCitasEnFranja } from '@/lib/disponibilidad'

type UserWithRol = { rol?: string }

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const franjas = await prisma.disponibilidadCalendario.findMany({
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  })

  return NextResponse.json({
    franjas: franjas.map((f) => ({
      id: f.id,
      dia_semana: f.diaSemana,
      hora_inicio: f.horaInicio,
      hora_fin: f.horaFin,
      activo: f.activo,
    })),
  })
}

const disponibilidadSchema = z.object({
  franjas: z.array(z.object({
    id: z.string().uuid().optional(),
    dia_semana: z.number().min(0).max(6),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato hora inválido (HH:MM)'),
    hora_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato hora inválido (HH:MM)'),
    activo: z.boolean(),
  })),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = disponibilidadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const franjasDeshabilitando = parsed.data.franjas.filter((f) => !f.activo && f.id)
  const advertencias: string[] = []

  for (const franja of franjasDeshabilitando) {
    const franjasBD = await prisma.disponibilidadCalendario.findMany({
      where: { id: franja.id, activo: true },
    })

    for (const fb of franjasBD) {
      const count = await verificarCitasEnFranja(fb.diaSemana, fb.horaInicio, fb.horaFin)
      if (count > 0) {
        advertencias.push(
          `La franja ${fb.horaInicio}-${fb.horaFin} del día ${fb.diaSemana} tiene ${count} cita(s) confirmadas.`
        )
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.disponibilidadCalendario.deleteMany({})

    if (parsed.data.franjas.length > 0) {
      await tx.disponibilidadCalendario.createMany({
        data: parsed.data.franjas.map((f) => ({
          diaSemana: f.dia_semana,
          horaInicio: f.hora_inicio,
          horaFin: f.hora_fin,
          activo: f.activo,
        })),
      })
    }
  })

  return NextResponse.json({
    ok: true,
    franjas_count: parsed.data.franjas.length,
    advertencias: advertencias.length > 0 ? advertencias : undefined,
  })
}