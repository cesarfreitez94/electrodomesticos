import type { Metadata } from 'next'
import { ServiceCard } from '@/components/public/ServiceCard'

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Catálogo completo de servicios de mantenimiento de electrodomésticos.',
}

type Servicio = {
  id: string
  nombre: string
  categoria: string
  precio_mantenimiento: number
  descripcion_breve: string
}

async function getServicios(): Promise<Servicio[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/public/servicios`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function ServiciosPage() {
  const servicios = await getServicios()

  const categorias = Array.from(new Set(servicios.map((s) => s.categoria)))

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-2">Nuestros Servicios</h1>
        <p className="text-muted-foreground mb-8">Explora todos nuestros servicios de reparación y mantenimiento</p>

        {categorias.map((categoria) => {
          const categoriaServicios = servicios.filter((s) => s.categoria === categoria)
          return (
            <section key={categoria} className="mb-10" aria-label={categoria}>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{categoria}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriaServicios.map((servicio) => (
                  <ServiceCard key={servicio.id} servicio={servicio} />
                ))}
              </div>
            </section>
          )
        })}

        {servicios.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay servicios disponibles en este momento</p>
          </div>
        )}
      </div>
    </div>
  )
}