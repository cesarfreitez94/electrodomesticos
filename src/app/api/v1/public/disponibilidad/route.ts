import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ciudadId = searchParams.get('ciudad_id')
  const fechaStr = searchParams.get('fecha')

  if (!ciudadId || !fechaStr) {
    return NextResponse.json(
      { error: 'ciudad_id y fecha son requeridos' },
      { status: 400 }
    )
  }

  const fecha = new Date(fechaStr)
  if (isNaN(fecha.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  const jsDay = fecha.getDay()
  const diaSemana = jsDay === 0 ? 6 : jsDay - 1

  const franjas = await prisma.disponibilidadCalendario.findMany({
    where: {
      diaSemana,
      activo: true,
    },
    orderBy: { horaInicio: 'asc' },
  })

  if (franjas.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  const tecnicosCiudad = await prisma.tecnicoCiudad.findMany({
    where: { ciudadId },
    include: {
      tecnico: {
        include: {
          citasTecnico: {
            where: {
              fechaHora: {
                gte: new Date(`${fechaStr}T00:00:00`),
                lt: new Date(`${fechaStr}T23:59:59`),
              },
              estado: { in: ['confirmado', 'en_curso'] },
            },
          },
        },
      },
    },
  })

  const slots: string[] = []

  for (const franja of franjas) {
    const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number)
    const [finH, finM] = franja.horaFin.split(':').map(Number)

    let hour = inicioH
    let minute = inicioM

    while (hour < finH || (hour === finH && minute < finM)) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      const hayDisponible = tecnicosCiudad.some(({ tecnico }) => {
        const slotStart = new Date(`${fechaStr}T${slotTime}:00`)
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

        return !tecnico.citasTecnico.some((cita) => {
          const citaStart = new Date(cita.fechaHora)
          const citaEnd = new Date(citaStart.getTime() + 60 * 60 * 1000)
          return slotStart < citaEnd && slotEnd > citaStart
        })
      })

      if (hayDisponible) {
        slots.push(slotTime)
      }

      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }
  }

  return NextResponse.json({ slots })
}