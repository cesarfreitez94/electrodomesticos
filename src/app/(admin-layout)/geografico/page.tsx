'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Ciudad {
  id: string
  nombre: string
  habilitada: boolean
  suspendida: boolean
  tecnicos_count: number
}

interface Region {
  id: string
  nombre: string
  ciudades: Ciudad[]
}

export default function GeograficoPage() {
  const [regiones, setRegiones] = useState<Region[]>([])

  useEffect(() => {
    fetch('/api/v1/admin/regiones')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRegiones(data)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Regiones / Ciudades</h1>
      </div>

      {regiones.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{r.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {r.ciudades.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-2 border rounded">
                <span>{c.nombre}</span>
                <div className="flex gap-2">
                  <Badge variant={c.habilitada ? 'default' : 'secondary'}>
                    {c.habilitada ? 'Habilitada' : 'Deshabilitada'}
                  </Badge>
                  {c.suspendida && <Badge variant="destructive">Suspendida</Badge>}
                  <span className="text-sm text-gray-500">{c.tecnicos_count} técnicos</span>
                </div>
              </div>
            ))}
            {r.ciudades.length === 0 && (
              <p className="text-gray-500 text-sm">Sin ciudades</p>
            )}
          </CardContent>
        </Card>
      ))}
      {regiones.length === 0 && (
        <p className="text-gray-500">No hay regiones registradas.</p>
      )}
    </div>
  )
}