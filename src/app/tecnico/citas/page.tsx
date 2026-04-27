'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Cita {
  id: string
  servicio: string
  ciudad: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_direccion: string
  fecha_hora: string
  estado: string
  confirmado_tecnico: boolean
  repuestos: string[]
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-purple-100 text-purple-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  emergencia: 'bg-red-100 text-red-800',
}

export default function TecnicoCitasPage() {
  const router = useRouter()
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/tecnico/citas')
      .then((r) => r.json())
      .then((data) => {
        setCitas(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center py-8">Cargando...</p>

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)

  const citasHoy = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha >= hoy && fecha < manana
  })

  const citasProximas = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha >= manana
  })

  const citasPasadas = citas.filter((c) => {
    const fecha = new Date(c.fecha_hora)
    return fecha < hoy
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Mis citas</h1>

      {citasHoy.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Hoy</h2>
          <div className="space-y-3">
            {citasHoy.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} />
            ))}
          </div>
        </section>
      )}

      {citasProximas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Próximas</h2>
          <div className="space-y-3">
            {citasProximas.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} />
            ))}
          </div>
        </section>
      )}

      {citasPasadas.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pasadas</h2>
          <div className="space-y-3">
            {citasPasadas.map((cita) => (
              <CitaCard key={cita.id} cita={cita} router={router} esPasada />
            ))}
          </div>
        </section>
      )}

      {citas.length === 0 && (
        <p className="text-center text-gray-500 py-8">No tienes citas asignadas</p>
      )}
    </div>
  )
}

function CitaCard({ cita, router, esPasada = false }: { cita: Cita; router: ReturnType<typeof useRouter>; esPasada?: boolean }) {
  return (
    <Card className={esPasada ? 'opacity-60' : ''}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{cita.servicio}</p>
            <p className="text-sm text-gray-500">{cita.ciudad}</p>
          </div>
          <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
        </div>

        <div className="text-sm">
          <p>
            <span className="text-gray-500">Cliente:</span> {cita.cliente_nombre}
          </p>
          <p>
            <span className="text-gray-500">Dirección:</span> {cita.cliente_direccion}
          </p>
          <p>
            <span className="text-gray-500">Hora:</span>{' '}
            {new Date(cita.fecha_hora).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {cita.confirmado_tecnico && (
          <p className="text-sm text-green-600 font-medium">✓ Confirmada</p>
        )}

        {!esPasada && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push(`/tecnico/citas/${cita.id}`)}
          >
            Ver detalle
          </Button>
        )}
      </CardContent>
    </Card>
  )
}