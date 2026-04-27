import { ServiceCard } from '@/components/public/ServiceCard'
import { ReelsYouTube } from '@/components/public/ReelsYouTube'

async function getServicios() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/public/servicios`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const defaultVideos = [
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
]

export default async function HomePage() {
  const servicios = await getServicios() as Array<{
    id: string
    nombre: string
    categoria: string
    precio_mantenimiento: number
    descripcion_breve: string
  }>

  return (
    <div>
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 px-4 text-center" aria-label="Hero">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Servicio técnico de electrodomésticos
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Agenda tu próxima visita en minutos. Técnicos certificados en tu ciudad.
        </p>
        <a
          href="/agendar"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
        >
          Agendar ahora
        </a>
      </section>

      <section className="py-12 px-4 max-w-7xl mx-auto" aria-label="Catálogo de servicios">
        <h2 className="text-2xl font-bold mb-8">Nuestros servicios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio) => (
            <ServiceCard key={servicio.id} servicio={servicio} />
          ))}
        </div>
      </section>

      <ReelsYouTube videos={defaultVideos} />
    </div>
  )
}