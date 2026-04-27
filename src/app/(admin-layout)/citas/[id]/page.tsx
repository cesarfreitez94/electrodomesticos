'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

type CitaDetalle = {
  id: string
  servicio: { id: string; nombre: string; precio: number }
  tecnico: { id: string; nombre: string; email: string } | null
  ciudad: { id: string; nombre: string; region: string }
  cliente: { nombre: string; email: string; telefono: string; direccion: string }
  fecha_hora: string
  estado: string
  confirmado_tecnico: boolean
  notas_admin: string | null
  repuestos: string[]
  created_at: string
}

type Tecnico = { id: string; nombre: string }

export default function DetalleCitaPage() {
  const params = useParams()
  const router = useRouter()
  const [cita, setCita] = useState<CitaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [nuevoTecnico, setNuevoTecnico] = useState('')
  const [notasAdmin, setNotasAdmin] = useState('')
  const [guardando, setGuardando] = useState(false)

  const id = params.id as string

  useEffect(() => {
    fetch(`/api/v1/admin/citas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCita(data)
        setNuevoEstado(data.estado)
        setNotasAdmin(data.notas_admin || '')
        setLoading(false)
      })

    fetch('/api/v1/admin/tecnicos')
      .then((r) => r.json())
      .then((data) => setTecnicos(data))
  }, [id])

  const cambiarEstado = async () => {
    if (!nuevoEstado) return
    setGuardando(true)
    const res = await fetch(`/api/v1/admin/citas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      setCita((prev) => prev ? { ...prev, estado: nuevoEstado } : null)
    }
    setGuardando(false)
  }

  const asignarTecnico = async () => {
    setGuardando(true)
    const res = await fetch(`/api/v1/admin/citas/${id}/tecnico`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tecnico_id: nuevoTecnico || null }),
    })
    if (res.ok) {
      router.refresh()
    }
    setGuardando(false)
  }

  if (loading || !cita) return <p>Cargando...</p>

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_curso: 'bg-purple-100 text-purple-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-gray-100 text-gray-800',
    emergencia: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>← Volver</Button>
        <h1 className="text-2xl font-bold">Detalle de cita</h1>
        <Badge className={estadoColors[cita.estado]}>{cita.estado}</Badge>
        {cita.estado === 'emergencia' && (
          <span className="text-sm text-red-600 font-medium">
            ⚠️ Requiere acción del admin
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Nombre:</strong> {cita.cliente.nombre}</p>
          <p><strong>Email:</strong> {cita.cliente.email}</p>
          <p><strong>Teléfono:</strong> {cita.cliente.telefono}</p>
          <p><strong>Dirección:</strong> {cita.cliente.direccion}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Servicio:</strong> {cita.servicio.nombre} — ${Number(cita.servicio.precio).toLocaleString('es-CL')}</p>
          <p><strong>Fecha y hora:</strong> {new Date(cita.fecha_hora).toLocaleString('es-CL')}</p>
          <p><strong>Ciudad:</strong> {cita.ciudad.nombre}</p>
          <p><strong>Región:</strong> {cita.ciudad.region}</p>
          {cita.repuestos.length > 0 && (
            <p><strong>Repuestos:</strong> {cita.repuestos.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Técnico asignado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Actual: {cita.tecnico ? cita.tecnico.nombre : 'Ninguno'}
          </p>
          <div className="flex gap-4 items-center">
            <Select value={nuevoTecnico} onValueChange={(value) => setNuevoTecnico(value || '')}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={asignarTecnico} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Asignar técnico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado de la cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={nuevoEstado} onValueChange={(value) => setNuevoEstado(value || '')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['confirmado', 'en_curso', 'completado', 'cancelado'].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={cambiarEstado} disabled={guardando || nuevoEstado === cita.estado}>
              {guardando ? 'Guardando...' : 'Actualizar estado'}
            </Button>
          </div>
          {cita.confirmado_tecnico && (
            <p className="text-sm text-green-600">✓ El técnico confirmó esta cita</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas del administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notasAdmin}
            onChange={(e) => setNotasAdmin(e.target.value)}
            placeholder="Notas internas..."
            rows={3}
          />
          <Button className="mt-2" variant="outline">
            Guardar notas
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}