import { Globe } from 'lucide-react'

interface RedSocial {
  id: string
  nombre: string
  url: string
  icono: string
}

async function getRedesSociales(): Promise<RedSocial[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${baseUrl}/api/v1/public/redes-sociales`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function RedesSociales() {
  const redes = await getRedesSociales()

  if (redes.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Síguenos</h3>
      <div className="flex flex-col gap-2">
        {redes.map((red) => (
          <a
            key={red.id}
            href={red.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            {red.nombre}
          </a>
        ))}
      </div>
    </div>
  )
}