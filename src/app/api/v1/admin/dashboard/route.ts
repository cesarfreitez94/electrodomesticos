import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type UserWithRol = { rol?: string }

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if ((session.user as UserWithRol)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [citasHoy, citasSemana, emergenciasActivas] = await Promise.all([
    prisma.cita.count({ where: { fechaHora: { gte: startOfDay, lt: endOfDay } } }),
    prisma.cita.count({ where: { fechaHora: { gte: startOfWeek, lt: endOfDay } } }),
    prisma.cita.count({ where: { estado: 'emergencia' } }),
  ])

  const serviciosTopRaw = await prisma.cita.groupBy({
    by: ['servicioId'],
    _count: { id: true },
    where: { fechaHora: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  const serviciosTop = await Promise.all(
    serviciosTopRaw.map(async (item) => {
      const servicio = await prisma.servicio.findUnique({ where: { id: item.servicioId } })
      return { nombre: servicio?.nombre || 'Desconocido', total: item._count.id }
    })
  )

  const citasCompletadas = await prisma.cita.findMany({
    where: { estado: 'completado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
    include: { servicio: true },
  })

  const ingresosPeriodo = citasCompletadas.reduce(
    (sum, cita) => sum + Number(cita.servicio.precioMantenimiento),
    0
  )

  const totalPeriodo = await prisma.cita.count({
    where: { fechaHora: { gte: startOfMonth, lt: endOfDay } },
  })
  const canceladasPeriodo = await prisma.cita.count({
    where: { estado: 'cancelado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
  })
  const tasaCancelacion = totalPeriodo > 0 ? canceladasPeriodo / totalPeriodo : 0

  return NextResponse.json({
    citas_hoy: citasHoy,
    citas_semana: citasSemana,
    ingresos_periodo: ingresosPeriodo,
    tasa_ocupacion: 0,
    tasa_cancelacion: Math.round(tasaCancelacion * 100) / 100,
    servicios_top: serviciosTop,
    emergencias_activas: emergenciasActivas,
  })
}