import type { Metadata } from 'next'
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'
import { ChatFlotante } from '@/components/public/ChatFlotante'
import { DarkModeToggle } from '@/components/public/DarkModeToggle'
import { AccesibilidadToggle } from '@/components/public/AccesibilidadToggle'

export const metadata: Metadata = {
  title: {
    default: 'Servicio Técnico de Electrodomésticos',
    template: '%s | Servicio Técnico',
  },
  description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos. Técnicos certificados, cobertura en todo Chile.',
  keywords: ['servicio técnico', 'electrodomésticos', 'mantenimiento', 'reparación', ' Chile'],
  authors: [{ name: 'Servicio Técnico' }],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com',
    siteName: 'Servicio Técnico',
    title: 'Servicio Técnico de Electrodomésticos',
    description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Servicio Técnico',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servicio Técnico de Electrodomésticos',
    description: 'Agenda tu próxima visita de mantenimiento.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AccesibilidadToggle />
      <DarkModeToggle />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatFlotante />
    </div>
  )
}