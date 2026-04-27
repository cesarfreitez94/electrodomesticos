import { prisma } from '@/lib/prisma'

export interface AsignacionResult {
  tecnicoId: string | null
  esEmergencia: boolean
  razon?: string
}

export async function asignarTecnico(
  ciudadId: string,
  fechaHora: string | Date
): Promise<AsignacionResult> {
  const slotStart = new Date(fechaHora)
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

  const tecnicosCiudad = await prisma.user.findMany({
    where: {
      rol: 'tecnico',
      activo: true,
      tecnicoCiudades: {
        some: { ciudadId },
      },
    },
    include: {
      citasTecnico: {
        where: {
          estado: { in: ['confirmado', 'en_curso'] },
          fechaHora: {
            lt: slotEnd,
            gt: slotStart,
          },
        },
      },
    },
  })

  if (tecnicosCiudad.length === 0) {
    return { tecnicoId: null, esEmergencia: true, razon: 'No hay técnicos activos en esta ciudad' }
  }

  let mejorTecnico: { id: string; count: number; createdAt: Date } | null = null

  for (const tecnico of tecnicosCiudad) {
    const count = tecnico.citasTecnico.length

    if (mejorTecnico === null) {
      mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
    } else if (count < mejorTecnico.count) {
      mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
    } else if (count === mejorTecnico.count) {
      if (tecnico.createdAt < mejorTecnico.createdAt) {
        mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
      }
    }
  }

  if (mejorTecnico && mejorTecnico.count === 0) {
    return { tecnicoId: mejorTecnico.id, esEmergencia: false }
  }

  if (mejorTecnico && mejorTecnico.count > 0) {
    return {
      tecnicoId: null,
      esEmergencia: true,
      razon: 'Todos los técnicos tienen conflictos de horario en el slot seleccionado',
    }
  }

  return { tecnicoId: null, esEmergencia: true, razon: 'No se encontró técnico disponible' }
}

export function calcularCargaTecnico(
  tecnicos: Array<{
    id: string
    citasTecnico: Array<{ fechaHora: Date; estado: string }>
    createdAt: Date
  }>,
  slotStart: Date,
  slotEnd: Date
): { tecnicoId: string | null; count: number } {
  const tecnicosConCarga = tecnicos.map((tecnico) => {
    const overlapCount = tecnico.citasTecnico.filter((cita) => {
      const citaStart = new Date(cita.fechaHora)
      const citaEnd = new Date(citaStart.getTime() + 60 * 60 * 1000)
      return slotStart < citaEnd && slotEnd > citaStart
    }).length
    return {
      id: tecnico.id,
      totalCount: tecnico.citasTecnico.length,
      overlapCount,
      createdAt: tecnico.createdAt,
    }
  })

  const todosConConflicto = tecnicosConCarga.every((t) => t.overlapCount > 0)
  if (todosConConflicto) {
    return { tecnicoId: null, count: tecnicosConCarga[0].overlapCount }
  }

  const disponibles = tecnicosConCarga.filter((t) => t.overlapCount === 0)
  disponibles.sort((a, b) => {
    if (a.totalCount !== b.totalCount) return a.totalCount - b.totalCount
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return { tecnicoId: disponibles[0].id, count: 0 }
}