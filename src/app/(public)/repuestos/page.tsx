type Repuesto = {
  id: string
  nombre: string
  descripcion: string | null
}

type RepuestosAgrupados = Record<string, Repuesto[]>

async function getRepuestos(): Promise<RepuestosAgrupados> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/public/repuestos`, { cache: 'no-store' })
  if (!res.ok) return {}
  return res.json()
}

export default async function RepuestosPage() {
  const repuestos = await getRepuestos()
  const categorias = Object.keys(repuestos)

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-2">Repuestos</h1>
        <p className="text-muted-foreground mb-8">Encuentra repuestos originales para tus electrodomésticos</p>

        {categorias.map((categoria) => (
          <section key={categoria} className="mb-10" aria-label={categoria}>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{categoria}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {repuestos[categoria].map((repuesto) => (
                <div key={repuesto.id} className="rounded-lg border p-4">
                  <h3 className="font-medium">{repuesto.nombre}</h3>
                  {repuesto.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground">{repuesto.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {categorias.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay repuestos disponibles en este momento</p>
          </div>
        )}
      </div>
    </div>
  )
}