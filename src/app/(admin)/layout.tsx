import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

type UserWithRol = { rol?: string }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as UserWithRol)?.rol !== 'admin') redirect('/tecnico/citas')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
        <div className="p-6 font-bold text-xl">Panel Admin</div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink href="/admin/dashboard" label="Dashboard" />
          <SidebarLink href="/admin/citas" label="Citas" />
          <SidebarLink href="/admin/tecnicos" label="Técnicos" />
          <SidebarLink href="/admin/servicios" label="Servicios" />
          <SidebarLink href="/admin/repuestos" label="Repuestos" />
          <SidebarLink href="/admin/geografico" label="Regiones / Ciudades" />
          <SidebarLink href="/admin/calendario" label="Calendario" />
          <SidebarLink href="/admin/notificaciones" label="Notificaciones" />
          <SidebarLink href="/admin/configuracion" label="Configuración" />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-400 hover:text-white">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 md:hidden flex items-center justify-between">
          <span className="font-bold">Panel Admin</span>
          <MobileMenu />
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      {label}
    </a>
  )
}

function MobileMenu() {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none">☰</summary>
      <div className="absolute right-0 top-full bg-gray-900 text-white rounded shadow p-4 space-y-2 min-w-40 z-50">
        <a href="/admin/dashboard" className="block">Dashboard</a>
        <a href="/admin/citas" className="block">Citas</a>
        <a href="/admin/tecnicos" className="block">Técnicos</a>
        <a href="/admin/servicios" className="block">Servicios</a>
        <a href="/admin/repuestos" className="block">Repuestos</a>
        <a href="/admin/geografico" className="block">Regiones / Ciudades</a>
        <a href="/admin/calendario" className="block">Calendario</a>
        <a href="/admin/notificaciones" className="block">Notificaciones</a>
        <a href="/admin/configuracion" className="block">Configuración</a>
      </div>
    </details>
  )
}