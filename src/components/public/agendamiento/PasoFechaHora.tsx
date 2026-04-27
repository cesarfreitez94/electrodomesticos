'use client'

import { useEffect, useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PasoFechaHoraProps {
  onNext: () => void
  onBack: () => void
}

export function PasoFechaHora({ onNext, onBack }: PasoFechaHoraProps) {
  const { ciudadId, setCiudadId, fechaHora, setFechaHora } = useAgendamientoStore()
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date()
  const minDate = today.toISOString().split('T')[0]

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  useEffect(() => {
    if (ciudadId && fechaHora) {
      const dateStr = fechaHora.split('T')[0]
      setLoading(true)
      fetch(`/api/v1/public/disponibilidad?ciudad_id=${ciudadId}&fecha=${dateStr}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data.slots || [])
          setLoading(false)
        })
        .catch(() => {
          setSlots([])
          setLoading(false)
        })
    }
  }, [ciudadId, fechaHora])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaHora('')
    setSlots([])
    setCiudadId(e.target.value)
    setError('')
  }

  const handleTimeSelect = (time: string) => {
    if (fechaHora) {
      const datePart = fechaHora.split('T')[0]
      setFechaHora(`${datePart}T${time}:00`)
    } else {
      setFechaHora(`1970-01-01T${time}:00`)
    }
    setError('')
  }

  const handleNext = () => {
    if (!fechaHora) {
      setError('Seleccione una fecha y hora')
      return
    }
    onNext()
  }

  const dateValue = fechaHora ? fechaHora.split('T')[0] : ''

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Fecha y hora</h2>
        <p className="text-sm text-muted-foreground">Seleccione cuando necesita la visita</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <input
            id="fecha"
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            min={minDate}
            max={maxDateStr}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          />
        </div>

        {dateValue && (
          <div>
            <Label>Hora disponible</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No hay horarios disponibles para este día</p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    className={`rounded-lg border p-2 text-sm transition-colors ${
                      fechaHora?.includes(slot)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={handleNext} disabled={!fechaHora}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}