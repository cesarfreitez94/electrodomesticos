import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const configs = await prisma.configuracionSistema.findMany({
    where: {
      clave: { in: ['horario_atencion_inicio', 'horario_atencion_fin', 'horario_atencion_dias'] },
    },
  })

  const map = configs.reduce((acc, c) => {
    acc[c.clave] = c.valor
    return acc
  }, {} as Record<string, string>)

  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  let disponible = false
  if (map['horario_atencion_dias']) {
    const diasHabilitados = JSON.parse(map['horario_atencion_dias'])
    if (diasHabilitados.includes(dayOfWeek)) {
      const inicio = map['horario_atencion_inicio'] || '09:00'
      const fin = map['horario_atencion_fin'] || '18:00'
      disponible = currentTime >= inicio && currentTime <= fin
    }
  }

  return NextResponse.json({
    horario_inicio: map['horario_atencion_inicio'] || '09:00',
    horario_fin: map['horario_atencion_fin'] || '18:00',
    dias_habilitados: map['horario_atencion_dias']
      ? JSON.parse(map['horario_atencion_dias'])
      : [1, 2, 3, 4, 5],
    disponible,
  })
}