'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  citas_hoy: number
  citas_semana: number
  ingresos_periodo: number
  tasa_ocupacion: number
  tasa_cancelacion: number
  servicios_top: { nombre: string; total: number }[]
  emergencias_activas: number
}

export function DashboardWidgets({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {data.emergencias_activas > 0 && (
          <Badge variant="destructive" className="text-sm">
            {data.emergencias_activas} emergencia{data.emergencias_activas > 1 ? 's' : ''} activa{data.emergencias_activas > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Citas hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.citas_hoy}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Citas esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.citas_semana}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${data.ingresos_periodo.toLocaleString('es-CL')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tasa de cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.tasa_cancelacion * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios más solicitados (30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.servicios_top.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos aún</p>
          ) : (
            <ul className="space-y-2">
              {data.servicios_top.map((s, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{s.nombre}</span>
                  <Badge variant="secondary">{s.total}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data.emergencias_activas > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-semibold">
            ⚠️ Hay {data.emergencias_activas} cita{data.emergencias_activas > 1 ? 's' : ''} en estado de emergencia que requieren acción.
          </p>
          <a href="/admin/citas?estado=emergencia" className="text-red-600 text-sm hover:underline mt-1 inline-block">
            Ver citas en emergencia →
          </a>
        </div>
      )}
    </div>
  )
}