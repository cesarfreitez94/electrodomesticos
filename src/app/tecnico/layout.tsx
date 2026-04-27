import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { Session } from 'next-auth'

function isTecnicoSession(session: Session): boolean {
  return session.user.rol === 'tecnico'
}

export default async function TecnicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isTecnicoSession(session)) redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">Portal Técnico</p>
          <p className="text-sm text-gray-500">{session.user.nombre}</p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="text-sm text-gray-500 hover:text-gray-700">Cerrar sesión</button>
        </form>
      </header>

      <main className="p-4">{children}</main>
    </div>
  )
}