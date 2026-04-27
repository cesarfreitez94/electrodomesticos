'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface Recordatorio {
  id: string
  horas_antes: number
  activo: boolean
}

interface RedSocial {
  id: string
  nombre: string
  url: string
  icono: string | null
  orden: number
  activo: boolean
}

export default function ConfiguracionPage() {
  const [horarioInicio, setHorarioInicio] = useState('09:00')
  const [horarioFin, setHorarioFin] = useState('18:00')
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1, 2, 3, 4, 5])

  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState('')

  const [redes, setRedes] = useState<RedSocial[]>([])
  const [nuevaRed, setNuevaRed] = useState({ nombre: '', url: '', icono: '' })

  useEffect(() => {
    fetch('/api/v1/admin/configuracion')
      .then((r) => r.json())
      .then((data) => {
        setHorarioInicio(data.horario_atencion_inicio)
        setHorarioFin(data.horario_atencion_fin)
        setDiasSeleccionados(data.horario_atencion_dias)
      })

    fetch('/api/v1/admin/recordatorios')
      .then((r) => r.json())
      .then((data) => setRecordatorios(data))

    fetch('/api/v1/admin/redes-sociales')
      .then((r) => r.json())
      .then((data) => setRedes(data))
  }, [])

  const guardarHorario = async () => {
    await fetch('/api/v1/admin/configuracion', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horario_atencion_inicio: horarioInicio,
        horario_atencion_fin: horarioFin,
        horario_atencion_dias: diasSeleccionados,
      }),
    })
  }

  const agregarRecordatorio = async () => {
    const horas = parseInt(nuevoRecordatorio)
    if (!horas) return

    const res = await fetch('/api/v1/admin/recordatorios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horas_antes: horas }),
    })

    if (res.ok) {
      const data = await res.json()
      setRecordatorios([...recordatorios, { id: data.id, horas_antes: horas, activo: true }])
      setNuevoRecordatorio('')
    }
  }

  const eliminarRecordatorio = async (id: string) => {
    await fetch(`/api/v1/admin/recordatorios/${id}`, { method: 'DELETE' })
    setRecordatorios(recordatorios.filter((r) => r.id !== id))
  }

  const agregarRed = async () => {
    const res = await fetch('/api/v1/admin/redes-sociales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevaRed, orden: redes.length }),
    })
    if (res.ok) {
      const data = await res.json()
      setRedes([...redes, { id: data.id, ...nuevaRed, icono: nuevaRed.icono || null, orden: redes.length, activo: true }])
      setNuevaRed({ nombre: '', url: '', icono: '' })
    }
  }

  const eliminarRed = async (id: string) => {
    await fetch(`/api/v1/admin/redes-sociales/${id}`, { method: 'DELETE' })
    setRedes(redes.filter((r) => r.id !== id))
  }

  const toggleDia = (dia: number) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter((d) => d !== dia))
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia].sort())
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Horario de atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Configura el horario en que el chat flotante muestra &quot;Disponible&quot;. Afuera de este horario muestra &quot;Fuera de horario&quot;.
          </p>

          <div className="flex gap-4 items-center">
            <div className="space-y-1">
              <Label htmlFor="inicio">Inicio</Label>
              <Input
                id="inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fin">Fin</Label>
              <Input
                id="fin"
                type="time"
                value={horarioFin}
                onChange={(e) => setHorarioFin(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {DIAS.map((nombre, i) => (
              <button
                key={i}
                onClick={() => toggleDia(i)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  diasSeleccionados.includes(i)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>

          <Button onClick={guardarHorario}>Guardar horario</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Recordatorios automáticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Define cuántos horas antes de la visita se envía un recordatorio al cliente.
          </p>

          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label>Horas antes</Label>
              <Input
                type="number"
                placeholder="Ej: 24"
                value={nuevoRecordatorio}
                onChange={(e) => setNuevoRecordatorio(e.target.value)}
                className="w-32"
                min={1}
                max={72}
              />
            </div>
            <Button onClick={agregarRecordatorio}>Agregar</Button>
          </div>

          <div className="space-y-2">
            {recordatorios.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span>{r.horas_antes} horas antes</span>
                <Button variant="ghost" size="sm" onClick={() => eliminarRecordatorio(r.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
            {recordatorios.length === 0 && (
              <p className="text-gray-400 text-sm">Sin recordatorios configurados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Enlaces que aparecen en el footer del sitio público.
          </p>

          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                placeholder="Instagram"
                value={nuevaRed.nombre}
                onChange={(e) => setNuevaRed({ ...nuevaRed, nombre: e.target.value })}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input
                placeholder="https://instagram.com/..."
                value={nuevaRed.url}
                onChange={(e) => setNuevaRed({ ...nuevaRed, url: e.target.value })}
                className="w-64"
              />
            </div>
            <div className="space-y-1">
              <Label>Ícono</Label>
              <Input
                placeholder="instagram"
                value={nuevaRed.icono}
                onChange={(e) => setNuevaRed({ ...nuevaRed, icono: e.target.value })}
                className="w-32"
              />
            </div>
            <Button onClick={agregarRed}>Agregar</Button>
          </div>

          <div className="space-y-2">
            {redes.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {r.icono && <span className="text-lg">{r.icono}</span>}
                  <span className="font-medium">{r.nombre}</span>
                  <span className="text-sm text-gray-500">{r.url}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => eliminarRed(r.id)}>
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}