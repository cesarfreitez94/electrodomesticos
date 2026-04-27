import { prisma } from '@/lib/prisma'

export interface FranjaHoraria {
  horaInicio: string
  horaFin: string
}

export interface SlotDisponible {
  hora: string
  disponible: boolean
}

export async function calcularSlotsDisponibles(
  ciudadId: string,
  fecha: string
): Promise<string[]> {
  const fechaDate = new Date(fecha)
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 6 : jsDay - 1

  const franjas = await prisma.disponibilidadCalendario.findMany({
    where: { diaSemana, activo: true },
    orderBy: { horaInicio: 'asc' },
  })

  if (franjas.length === 0) return []

  const tecnicosCiudad = await prisma.user.findMany({
    where: {
      rol: 'tecnico',
      activo: true,
      tecnicoCiudades: { some: { ciudadId } },
    },
    include: {
      citasTecnico: {
        where: {
          fechaHora: {
            gte: new Date(`${fecha}T00:00:00`),
            lt: new Date(`${fecha}T23:59:59`),
          },
          estado: { in: ['confirmado', 'en_curso'] },
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
      const slotStart = new Date(`${fecha}T${slotTime}:00`)
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

      const hayDisponible = tecnicosCiudad.some((tecnico) => {
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

  return slots
}

export async function verificarSlotDisponible(
  ciudadId: string,
  fechaHora: string
): Promise<boolean> {
  const fecha = fechaHora.split('T')[0]
  const hora = fechaHora.split('T')[1].substring(0, 5)
  const slots = await calcularSlotsDisponibles(ciudadId, fecha)
  return slots.includes(hora)
}

export async function verificarCitasEnFranja(
  diaSemana: number,
  horaInicio: string,
  horaFin: string
): Promise<number> {
  const citas = await prisma.cita.findMany({
    where: {
      estado: { in: ['confirmado', 'en_curso'] },
    },
    include: {
      ciudad: true,
    },
  })

  let count = 0
  for (const cita of citas) {
    const fecha = new Date(cita.fechaHora)
    const jsDay = fecha.getDay()
    const citaDiaSemana = jsDay === 0 ? 6 : jsDay - 1

    if (citaDiaSemana !== diaSemana) continue

    const horaCita = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`

    if (horaCita >= horaInicio && horaCita < horaFin) {
      count++
    }
  }

  return count
}