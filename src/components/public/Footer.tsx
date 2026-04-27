import Link from 'next/link'
import { RedesSociales } from './RedesSociales'

export async function Footer() {
  return (
    <footer className="border-t bg-muted/50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Navegación</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
              <li><Link href="/servicios" className="hover:text-foreground">Servicios</Link></li>
              <li><Link href="/repuestos" className="hover:text-foreground">Repuestos</Link></li>
              <li><Link href="/agendar" className="hover:text-foreground">Agendar</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Contacto</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Teléfono: (123) 456-7890</li>
              <li>Email: info@serviciotecnico.com</li>
            </ul>
          </div>

          <RedesSociales />
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Servicio Técnico. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}