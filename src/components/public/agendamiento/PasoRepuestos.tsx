'use client'

import { useEffect, useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface Repuesto {
  id: string
  nombre: string
  descripcion: string | null
}

interface RepuestosAgrupados {
  [categoria: string]: Repuesto[]
}

interface PasoRepuestosProps {
  onNext: () => void
  onBack: () => void
}

export function PasoRepuestos({ onNext, onBack }: PasoRepuestosProps) {
  const { repuestoIds, setRepuestoIds } = useAgendamientoStore()
  const [repuestos, setRepuestos] = useState<RepuestosAgrupados>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/public/repuestos')
      .then((r) => r.json())
      .then((data) => {
        setRepuestos(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleRepuesto = (id: string) => {
    if (repuestoIds.includes(id)) {
      setRepuestoIds(repuestoIds.filter((r) => r !== id))
    } else {
      setRepuestoIds([...repuestoIds, id])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categorias = Object.keys(repuestos)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Repuestos (opcional)</h2>
        <p className="text-sm text-muted-foreground">Seleccione los repuestos que necesita</p>
      </div>

      {categorias.length === 0 ? (
        <p className="text-muted-foreground py-4">No hay repuestos disponibles</p>
      ) : (
        <div className="space-y-6 max-h-[400px] overflow-y-auto">
          {categorias.map((categoria) => (
            <div key={categoria}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{categoria}</h3>
              <div className="space-y-2">
                {repuestos[categoria].map((repuesto) => (
                  <label
                    key={repuesto.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      repuestoIds.includes(repuesto.id) ? 'bg-muted/50' : 'hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={repuestoIds.includes(repuesto.id)}
                      onCheckedChange={() => toggleRepuesto(repuesto.id)}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm">{repuesto.nombre}</span>
                      {repuesto.descripcion && (
                        <p className="mt-1 text-xs text-muted-foreground">{repuesto.descripcion}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}