import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agendar cita',
  description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos en minutos.',
}

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}