'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Notificacion {
  id: string
  tipo: string
  destinatario: string
  estado: string
  error_detalle: string | null
  enviado_at: string
  cita: {
    id: string
    cliente: string
    email: string
    fecha: string
    servicio: string
  } | null
}

const TIPO_LABELS: Record<string, string> = {
  confirmacion_cliente: 'Confirmación cliente',
  notif_tecnico: 'Notificación técnico',
  recordatorio: 'Recordatorio',
  cancelacion: 'Cancelación',
  emergencia_admin: 'Emergencia admin',
}

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'todas' | 'fallidas'>('todas')

  useEffect(() => {
    const url = tab === 'fallidas'
      ? '/api/v1/admin/notificaciones/fallidas'
      : '/api/v1/admin/notificaciones'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setNotificaciones(data.notificaciones || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
  }, [tab])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'todas' | 'fallidas')}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="fallidas">
            Fallidas
            {total > 0 && (
              <Badge variant="destructive" className="ml-2">{total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4">
          <ListaNotificaciones notificaciones={notificaciones} loading={loading} />
        </TabsContent>

        <TabsContent value="fallidas" className="mt-4">
          <ListaNotificaciones notificaciones={notificaciones} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ListaNotificaciones({ notificaciones, loading }: { notificaciones: Notificacion[]; loading: boolean }) {
  if (loading) return <p>Cargando...</p>
  if (notificaciones.length === 0) {
    return <p className="text-gray-500 text-center py-8">No hay notificaciones</p>
  }

  return (
    <div className="space-y-3">
      {notificaciones.map((n) => (
        <Card key={n.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={n.estado === 'fallido' ? 'destructive' : 'secondary'}>
                    {n.estado}
                  </Badge>
                  <span className="text-sm font-medium">
                    {TIPO_LABELS[n.tipo] || n.tipo}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Para: {n.destinatario}</p>
                {n.cita && (
                  <p className="text-sm text-gray-500">
                    {n.cita.cliente} — {n.cita.servicio} —{' '}
                    {new Date(n.cita.fecha).toLocaleString('es-CL')}
                  </p>
                )}
                {n.error_detalle && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                    <strong>Error:</strong> {n.error_detalle}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.enviado_at).toLocaleString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}