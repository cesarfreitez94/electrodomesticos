'use client'

import { useEffect, useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Ciudad {
  id: string
  nombre: string
  region: string
}

interface PasoDireccionProps {
  onNext: () => void
  onBack: () => void
}

export function PasoDireccion({ onNext, onBack }: PasoDireccionProps) {
  const { direccion, setDireccion, ciudadId, setCiudadId } = useAgendamientoStore()
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/v1/public/ciudades')
      .then((r) => r.json())
      .then((data) => {
        setCiudades(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const validate = () => {
    if (!direccion || direccion.length < 5) {
      setError('La dirección debe tener al menos 5 caracteres')
      return false
    }
    if (!ciudadId) {
      setError('Seleccione una ciudad')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (validate()) {
      onNext()
    }
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
        <h2 className="text-lg font-semibold mb-1">Dirección</h2>
        <p className="text-sm text-muted-foreground">Ingrese su dirección y ciudad</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={direccion}
            onChange={(e) => {
              setDireccion(e.target.value)
              if (error) setError('')
            }}
            placeholder="Av. Principal 123, Depto 4B"
            aria-invalid={!!error}
          />
        </div>

        <div>
          <Label htmlFor="ciudad">Ciudad</Label>
          <select
            id="ciudad"
            value={ciudadId || ''}
            onChange={(e) => {
              setCiudadId(e.target.value || '')
              if (error) setError('')
            }}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            <option value="">Seleccione una ciudad</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.region})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={handleNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}