'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Atributo {
  id: string
  nombre: string
  tipo: string
  opciones: string[] | null
}

interface SubProducto {
  id: string
  nombre: string
  precio: number
  atributos: Atributo[]
}

interface ServicioDetalle {
  id: string
  nombre: string
  categoria: string
  descripcion: string
  precio_mantenimiento: number
  sub_productos: SubProducto[]
}

interface ServicePopupProps {
  servicioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServicePopup({ servicioId, open, onOpenChange }: ServicePopupProps) {
  const [servicio, setServicio] = useState<ServicioDetalle | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && servicioId) {
      setLoading(true)
      fetch(`/api/v1/public/servicios/${servicioId}`)
        .then((r) => r.json())
        .then((data) => {
          setServicio(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [open, servicioId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : servicio ? (
          <>
            <DialogHeader>
              <Badge variant="secondary" className="w-fit">{servicio.categoria}</Badge>
              <DialogTitle className="text-xl">{servicio.nombre}</DialogTitle>
              <DialogDescription className="text-base">{servicio.descripcion}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm font-medium">Precio mantenimiento</span>
                <span className="text-xl font-bold text-primary">
                  ${servicio.precio_mantenimiento.toLocaleString('es-CL')}
                </span>
              </div>

              {servicio.sub_productos.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Subproductos disponibles</h4>
                  <div className="space-y-2">
                    {servicio.sub_productos.map((sp) => (
                      <div key={sp.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <span className="font-medium">{sp.nombre}</span>
                          {sp.atributos.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {sp.atributos.map((a) => a.nombre).join(' • ')}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-primary">
                          ${sp.precio.toLocaleString('es-CL')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <Link href={`/agendar?servicio=${servicio.id}`} className="w-full">
                <Button className="w-full" size="lg">
                  Agendar ahora
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No se pudo cargar la información del servicio
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}