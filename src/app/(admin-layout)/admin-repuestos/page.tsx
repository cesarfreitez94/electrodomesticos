'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Repuesto {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  disponible: boolean
}

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])

  useEffect(() => {
    fetch('/api/v1/admin/repuestos')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRepuestos(data)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Repuestos</h1>
      </div>

      <div className="grid gap-4">
        {repuestos.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.nombre}</p>
                  <p className="text-sm text-gray-500">{r.categoria}</p>
                  {r.descripcion && <p className="text-sm text-gray-400">{r.descripcion}</p>}
                </div>
                <div className="flex gap-2">
                  <Badge variant={r.disponible ? 'default' : 'secondary'}>
                    {r.disponible ? 'Disponible' : 'No disponible'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {repuestos.length === 0 && (
          <p className="text-gray-500">No hay repuestos registrados.</p>
        )}
      </div>
    </div>
  )
}