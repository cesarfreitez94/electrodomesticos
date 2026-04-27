'use client'

import { useAgendamientoStore } from '@/store/agendamiento'
import { PasoServicio } from '@/components/public/agendamiento/PasoServicio'
import { PasoRepuestos } from '@/components/public/agendamiento/PasoRepuestos'
import { PasoCliente } from '@/components/public/agendamiento/PasoCliente'
import { PasoDireccion } from '@/components/public/agendamiento/PasoDireccion'
import { PasoFechaHora } from '@/components/public/agendamiento/PasoFechaHora'
import { PasoConfirmacion } from '@/components/public/agendamiento/PasoConfirmacion'

const PASOS = ['Servicio', 'Repuestos', 'Datos', 'Dirección', 'Fecha/Hora', 'Confirmación']

export default function AgendarPage() {
  const { paso, setPaso } = useAgendamientoStore()

  const avanzar = () => setPaso(paso + 1)
  const retroceder = () => setPaso(paso - 1)

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Agendar Cita</h1>
          <p className="text-muted-foreground">Complete los siguientes pasos para agendar su visita</p>
        </div>

        <nav className="flex items-center justify-between mb-8" aria-label="Progreso del formulario">
          {PASOS.map((nombre, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i <= paso
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
                aria-current={i === paso ? 'step' : undefined}
              >
                {i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < paso ? 'bg-primary' : 'bg-muted'}`} aria-hidden="true" />
              )}
            </div>
          ))}
        </nav>

        <div className="bg-background rounded-xl shadow-sm p-6">
          {paso === 0 && <PasoServicio onNext={avanzar} />}
          {paso === 1 && <PasoRepuestos onNext={avanzar} onBack={retroceder} />}
          {paso === 2 && <PasoCliente onNext={avanzar} onBack={retroceder} />}
          {paso === 3 && <PasoDireccion onNext={avanzar} onBack={retroceder} />}
          {paso === 4 && <PasoFechaHora onNext={avanzar} onBack={retroceder} />}
          {paso === 5 && <PasoConfirmacion onBack={retroceder} />}
        </div>
      </div>
    </div>
  )
}