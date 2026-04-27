'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface CitaDetalle {
  id: string
  servicio: { nombre: string; precio: number }
  ciudad: { nombre: string }
  cliente: { nombre: string; telefono: string; direccion: string }
  fecha_hora: string
  estado: string
  confirmado_tecnico: boolean
  repuestos: string[]
}

export default function DetalleCitaPage() {
  const params = useParams()
  const router = useRouter()
  const [cita, setCita] = useState<CitaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  const id = params.id as string

  useEffect(() => {
    fetch(`/api/v1/tecnico/citas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCita(data)
        setLoading(false)
      })
  }, [id])

  const confirmar = async () => {
    setConfirmando(true)
    const res = await fetch(`/api/v1/tecnico/citas/${id}/confirmar`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      setCita((prev) => prev ? { ...prev, confirmado_tecnico: data.confirmado_tecnico } : null)
    }
    setConfirmando(false)
  }

  if (loading || !cita) return <p className="text-center py-8">Cargando...</p>

  const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_curso: 'bg-purple-100 text-purple-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-gray-100 text-gray-800',
    emergencia: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        ← Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{cita.servicio.nombre}</CardTitle>
            <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold">
                {new Date(cita.fecha_hora).toLocaleDateString('es-CL', { day: '2-digit' })}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">
                {new Date(cita.fecha_hora).toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-gray-500">
                {new Date(cita.fecha_hora).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Cliente</h3>
            <p className="font-medium">{cita.cliente.nombre}</p>
            <a
              href={`tel:${cita.cliente.telefono}`}
              className="text-primary hover:underline text-sm"
            >
              {cita.cliente.telefono}
            </a>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Dirección</h3>
            <p>{cita.cliente.direccion}</p>
            <p className="text-sm text-gray-500">{cita.ciudad.nombre}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(cita.cliente.direccion + ', ' + cita.ciudad.nombre)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline"
            >
              Abrir en Google Maps →
            </a>
          </div>

          {cita.repuestos.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Repuestos solicitados</h3>
                <ul className="list-disc list-inside text-sm">
                  {cita.repuestos.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Valor del servicio</span>
            <span className="font-semibold text-lg">
              ${cita.servicio.precio.toLocaleString('es-CL')}
            </span>
          </div>

          {cita.estado !== 'completado' && cita.estado !== 'cancelado' && (
            <div className="pt-4">
              {cita.confirmado_tecnico ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-md text-center font-medium">
                  ✓ Has confirmado esta cita
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={confirmar}
                  disabled={confirmando}
                >
                  {confirmando ? 'Confirmando...' : 'Confirmar que entendí la cita'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}