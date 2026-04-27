'use client'

import { useEffect, useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Check } from 'lucide-react'

interface Servicio {
  id: string
  nombre: string
  categoria: string
  precio_mantenimiento: number
  descripcion_breve: string
}

interface PasoServicioProps {
  onNext: () => void
}

export function PasoServicio({ onNext }: PasoServicioProps) {
  const { servicioId, setServicioId } = useAgendamientoStore()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/public/servicios')
      .then((r) => r.json())
      .then((data) => {
        setServicios(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelect = (id: string) => {
    setServicioId(id)
  }

  const handleNext = () => {
    if (servicioId) onNext()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Seleccione un servicio</h2>
        <p className="text-sm text-muted-foreground">Elija el servicio que necesita</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {servicios.map((servicio) => (
          <Card
            key={servicio.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              servicioId === servicio.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelect(servicio.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">{servicio.categoria}</span>
                  <h3 className="font-medium mt-1">{servicio.nombre}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{servicio.descripcion_breve}</p>
                  <span className="mt-2 block text-sm font-semibold text-primary">
                    ${servicio.precio_mantenimiento.toLocaleString('es-CL')}
                  </span>
                </div>
                {servicioId === servicio.id && (
                  <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!servicioId}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}