'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ESTADOS = ['pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado', 'emergencia']

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-purple-100 text-purple-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  emergencia: 'bg-red-100 text-red-800',
}

export default function CitasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [citas, setCitas] = useState<Array<{
  id: string
  servicio: string
  tecnico: { id: string; nombre: string } | null
  ciudad: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string
  cliente_direccion: string
  fecha_hora: string
  estado: string
  confirmado_tecnico: boolean
  notas_admin: string | null
}>>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const estadoFilter = searchParams.get('estado') || ''
  const fechaFilter = searchParams.get('fecha') || ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (estadoFilter) params.set('estado', estadoFilter)
    if (fechaFilter) params.set('fecha', fechaFilter)
    params.set('page', String(page))

    setLoading(true)
    fetch(`/api/v1/admin/citas?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCitas(data.citas || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
  }, [page, estadoFilter, fechaFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Citas</h1>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input
          type="date"
          value={fechaFilter}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString())
            if (e.target.value) params.set('fecha', e.target.value)
            else params.delete('fecha')
            router.push(`/admin/citas?${params.toString()}`)
          }}
          className="w-40"
        />

        <Select
          value={estadoFilter}
          onValueChange={(v) => {
            const params = new URLSearchParams(searchParams.toString())
            if (v) params.set('estado', v)
            else params.delete('estado')
            router.push(`/admin/citas?${params.toString()}`)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{cita.cliente_nombre}</span>
                      <Badge className={ESTADO_COLORS[cita.estado]}>{cita.estado}</Badge>
                      {cita.confirmado_tecnico && (
                        <Badge variant="outline">Técnico confirmó</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{cita.servicio} — {cita.ciudad}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(cita.fecha_hora).toLocaleString('es-CL')}
                    </p>
                    {cita.tecnico && (
                      <p className="text-sm text-gray-500">Técnico: {cita.tecnico.nombre}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/citas/${cita.id}`)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {citas.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay citas para los filtros seleccionados</p>
          )}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Anterior
          </Button>
          <span className="px-4 py-2 text-sm">Página {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={citas.length < 20}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}