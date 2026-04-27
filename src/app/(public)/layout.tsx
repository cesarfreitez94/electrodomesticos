import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'
import { ChatFlotante } from '@/components/public/ChatFlotante'
import { DarkModeToggle } from '@/components/public/DarkModeToggle'
import { AccesibilidadToggle } from '@/components/public/AccesibilidadToggle'

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