'use client'

import { useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface PasoConfirmacionProps {
  onBack: () => void
}

interface Respuesta {
  cita_id: string
  estado: 'confirmado' | 'emergencia'
  mensaje: string
}

export function PasoConfirmacion({ onBack }: PasoConfirmacionProps) {
  const {
    servicioId,
    repuestoIds,
    cliente,
    direccion,
    ciudadId,
    fechaHora,
    reset,
  } = useAgendamientoStore()

  const [loading, setLoading] = useState(false)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!servicioId || !ciudadId || !fechaHora) {
      setError('Faltan datos requeridos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/public/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio_id: servicioId,
          repuesto_ids: repuestoIds.length > 0 ? repuestoIds : [],
          cliente_nombre: cliente.nombre,
          cliente_email: cliente.email,
          cliente_telefono: cliente.telefono,
          cliente_direccion: direccion,
          ciudad_id: ciudadId,
          fecha_hora: fechaHora,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al agendar la cita')
        setLoading(false)
        return
      }

      setRespuesta(data)
      reset()
    } catch {
      setError('Error de conexión. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (respuesta) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {respuesta.estado === 'emergencia' ? 'Solicitud recibida' : '¡Cita confirmada!'}
        </h2>
        <p className="text-muted-foreground mb-4">{respuesta.mensaje}</p>
        {respuesta.cita_id && (
          <p className="text-sm text-muted-foreground">ID de cita: {respuesta.cita_id}</p>
        )}
        <a href="/agendar" className="mt-6 inline-block">
          <Button variant="outline">Agendar otra cita</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Confirmar información</h2>
        <p className="text-sm text-muted-foreground">Revise los datos antes de confirmar</p>
      </div>

      <div className="rounded-lg border p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cliente:</span>
          <span className="font-medium">{cliente.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span>{cliente.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Teléfono:</span>
          <span>{cliente.telefono}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dirección:</span>
          <span>{direccion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fecha/Hora:</span>
          <span>{fechaHora ? new Date(fechaHora).toLocaleString('es-CL') : '-'}</span>
        </div>
        {repuestoIds.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Repuestos:</span>
            <span>{repuestoIds.length} seleccionado(s)</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Atrás
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            'Confirmar'
          )}
        </Button>
      </div>
    </div>
  )
}