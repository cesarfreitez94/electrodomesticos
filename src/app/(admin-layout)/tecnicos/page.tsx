'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Tecnico {
  id: string
  nombre: string
  email: string
  activo: boolean
  ciudades: { id: string; nombre: string; region: string }[]
}

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])

  useEffect(() => {
    fetch('/api/v1/admin/tecnicos')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTecnicos(data)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Técnicos</h1>
      </div>

      <div className="grid gap-4">
        {tecnicos.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{t.nombre}</p>
                  <p className="text-sm text-gray-500">{t.email}</p>
                  <p className="text-sm text-gray-500">
                    Ciudades: {t.ciudades.map((c) => c.nombre).join(', ') || 'Sin asignar'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={t.activo ? 'default' : 'secondary'}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tecnicos.length === 0 && (
          <p className="text-gray-500">No hay técnicos registrados.</p>
        )}
      </div>
    </div>
  )
}