'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Configuracion {
  disponible: boolean
  horario_inicio: string
  horario_fin: string
}

export function ChatFlotante() {
  const [abierto, setAbierto] = useState(false)
  const [config, setConfig] = useState<Configuracion | null>(null)

  useEffect(() => {
    fetch('/api/v1/public/configuracion')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig({ disponible: false, horario_inicio: '09:00', horario_fin: '18:00' }))
  }, [])

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label={abierto ? 'Cerrar chat' : 'Abrir chat'}
      >
        {abierto ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {abierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-lg bg-popover shadow-xl border" role="dialog" aria-label="Chat de contacto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Contacto</h3>
              {config && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    config.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {config.disponible ? 'Disponible' : 'Fuera de horario'}
                </span>
              )}
            </div>
            {config && (
              <p className="mt-1 text-xs text-muted-foreground">
                Horario: {config.horario_inicio} - {config.horario_fin}
              </p>
            )}
          </div>
          <form className="p-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Input placeholder="Tu nombre" required aria-label="Nombre" />
            </div>
            <div>
              <Input type="email" placeholder="Tu correo" required aria-label="Correo electrónico" />
            </div>
            <div>
              <Textarea placeholder="¿En qué podemos ayudarte?" rows={3} required aria-label="Mensaje" />
            </div>
            <Button type="submit" className="w-full">Enviar</Button>
          </form>
        </div>
      )}
    </>
  )
}