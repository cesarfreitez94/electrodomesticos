'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ServicePopup } from './ServicePopup'

interface Servicio {
  id: string
  nombre: string
  categoria: string
  precio_mantenimiento: number
  descripcion_breve: string
}

interface ServiceCardProps {
  servicio: Servicio
}

export function ServiceCard({ servicio }: ServiceCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => setOpen(true)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{servicio.categoria}</span>
              <CardTitle className="mt-1">{servicio.nombre}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{servicio.descripcion_breve}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-primary">
              ${servicio.precio_mantenimiento.toLocaleString('es-CL')}
            </span>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
              Ver detalle
            </Button>
          </div>
        </CardContent>
      </Card>

      <ServicePopup servicioId={servicio.id} open={open} onOpenChange={setOpen} />
    </>
  )
}