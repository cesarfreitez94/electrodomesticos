import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardWidgets } from '@/components/admin/DashboardWidgets'

async function getDashboardData() {
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

  const serviciosTop = await prisma.cita.groupBy({
    by: ['servicioId'],
    _count: { id: true },
    where: { fechaHora: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  const serviciosTopNombres = await Promise.all(
    serviciosTop.map(async (s) => {
      const svc = await prisma.servicio.findUnique({ where: { id: s.servicioId } })
      return { nombre: svc?.nombre ?? 'N/A', total: s._count.id }
    })
  )

  const citasCompletadas = await prisma.cita.findMany({
    where: { estado: 'completado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
    include: { servicio: true },
  })

  const ingresos = citasCompletadas.reduce(
    (acc, c) => acc + Number(c.servicio.precioMantenimiento),
    0
  )

  const total = await prisma.cita.count({ where: { fechaHora: { gte: startOfMonth, lt: endOfDay } } })
  const canceladas = await prisma.cita.count({
    where: { estado: 'cancelado', fechaHora: { gte: startOfMonth, lt: endOfDay } },
  })

  return {
    citas_hoy: citasHoy,
    citas_semana: citasSemana,
    ingresos_periodo: ingresos,
    tasa_ocupacion: 0,
    tasa_cancelacion: total > 0 ? Math.round((canceladas / total) * 100) / 100 : 0,
    servicios_top: serviciosTopNombres,
    emergencias_activas: emergenciasActivas,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session || (session.user as { rol?: string })?.rol !== 'admin') redirect('/login')

  const data = await getDashboardData()

  return <DashboardWidgets data={data} />
}