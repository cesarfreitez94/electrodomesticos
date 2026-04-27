import type { Metadata } from 'next'
import './globals.css'
import { InicializarScheduler } from '@/components/InicializarScheduler'

export const metadata: Metadata = {
  title: 'Plataforma de Mantenimiento',
  description: 'Sistema de gestión de servicios de mantenimiento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <InicializarScheduler />
        {children}
      </body>
    </html>
  )
}
