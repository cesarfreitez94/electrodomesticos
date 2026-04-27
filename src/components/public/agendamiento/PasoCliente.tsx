'use client'

import { useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface PasoClienteProps {
  onNext: () => void
  onBack: () => void
}

const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
const telefonoRegex = /^[0-9+\-() ]+$/

export function PasoCliente({ onNext, onBack }: PasoClienteProps) {
  const { cliente, setCliente } = useAgendamientoStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!cliente.nombre || cliente.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (!nombreRegex.test(cliente.nombre)) {
      newErrors.nombre = 'El nombre solo puede contener letras'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cliente.email || !emailRegex.test(cliente.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!cliente.telefono || cliente.telefono.length < 7) {
      newErrors.telefono = 'Teléfono demasiado corto'
    } else if (!telefonoRegex.test(cliente.telefono)) {
      newErrors.telefono = 'Teléfono contiene caracteres inválidos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: 'nombre' | 'email' | 'telefono', value: string) => {
    setCliente({ ...cliente, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleNext = () => {
    if (validate()) {
      onNext()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Datos del cliente</h2>
        <p className="text-sm text-muted-foreground">Ingrese su información de contacto</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            value={cliente.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Juan Pérez"
            aria-invalid={!!errors.nombre}
          />
          {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={cliente.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="juan@ejemplo.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            type="tel"
            value={cliente.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            placeholder="+56 9 1234 5678"
            aria-invalid={!!errors.telefono}
          />
          {errors.telefono && <p className="mt-1 text-xs text-destructive">{errors.telefono}</p>}
        </div>
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