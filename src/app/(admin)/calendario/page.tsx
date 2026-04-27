'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Franja {
  id?: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

export default function CalendarioPage() {
  const [franjas, setFranjas] = useState<Franja[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/v1/admin/disponibilidad')
      .then((r) => r.json())
      .then((data) => {
        setFranjas(data.franjas || [])
        setLoading(false)
      })
  }, [])

  const initFranjas = (): Franja[] => {
    return DIAS.map((_, i) => {
      const existente = franjas.filter((f) => f.dia_semana === i)
      if (existente.length > 0) return existente[0]
      return { dia_semana: i, hora_inicio: '09:00', hora_fin: '18:00', activo: false }
    })
  }

  const [franjasEditando, setFranjasEditando] = useState<Franja[]>([])

  useEffect(() => {
    if (!loading) {
      setFranjasEditando(initFranjas())
    }
  }, [loading])

  const actualizarFranja = (index: number, campo: keyof Franja, valor: string | boolean) => {
    setFranjasEditando((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [campo]: valor }
      return next
    })
  }

  const guardar = async () => {
    setGuardando(true)
    const res = await fetch('/api/v1/admin/disponibilidad', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ franjas: franjasEditando }),
    })
    const data = await res.json()

    if (res.ok) {
      setMensaje({
        type: data.advertencias ? 'warn' : 'ok',
        text: data.advertencias
          ? `Guardado. ${data.advertencias.length} advertencia(s) sobre citas existentes.`
          : 'Configuración guardada correctamente.',
      })
      if (!data.advertencias) {
        setFranjas(franjasEditando)
      }
    } else {
      setMensaje({ type: 'warn', text: 'Error al guardar' })
    }
    setGuardando(false)
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de disponibilidad</h1>
      </div>

      <p className="text-sm text-gray-600">
        Configura los horarios disponibles para cada día de la semana. Los cambios afectan la disponibilidad visible para los clientes al agendar.
      </p>

      {mensaje && (
        <div className={`p-4 rounded-md ${mensaje.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
          {mensaje.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Horarios por día</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Día</TableHead>
                <TableHead>Hora inicio</TableHead>
                <TableHead>Hora fin</TableHead>
                <TableHead className="w-24">Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franjasEditando.map((franja, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <span className="font-medium">{DIAS[franja.dia_semana]}</span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={franja.hora_inicio}
                      onChange={(e) => actualizarFranja(i, 'hora_inicio', e.target.value)}
                      className="w-32"
                      disabled={!franja.activo}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={franja.hora_fin}
                      onChange={(e) => actualizarFranja(i, 'hora_fin', e.target.value)}
                      className="w-32"
                      disabled={!franja.activo}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={franja.activo}
                      onChange={(e) => actualizarFranja(i, 'activo', e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replicar al resto del mes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            La configuración de cada día se aplica automáticamente a todas las semanas del mes para el mismo día de la semana. No es necesario replicar manualmente — el sistema lo calcula dinámicamente al mostrar disponibilidad.
          </p>
          <div className="bg-blue-50 rounded-md p-4 text-sm text-blue-800">
            ℹ️ El sistema calcula la disponibilidad dinámicamente combinando las franjas configuradas con las citas existentes. No almacena slots por fecha individual.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}