'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Servicio {
  id: string
  nombre: string
  categoria: string
  precio_mantenimiento: number
  activo: boolean
  sub_productos_count: number
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])

  useEffect(() => {
    fetch('/api/v1/admin/servicios')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServicios(data)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Servicios</h1>
      </div>

      <div className="grid gap-4">
        {servicios.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{s.nombre}</p>
                  <p className="text-sm text-gray-500">{s.categoria}</p>
                  <p className="text-sm text-gray-500">
                    {s.sub_productos_count} sub-productos · ${s.precio_mantenimiento}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={s.activo ? 'default' : 'secondary'}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {servicios.length === 0 && (
          <p className="text-gray-500">No hay servicios registrados.</p>
        )}
      </div>
    </div>
  )
}