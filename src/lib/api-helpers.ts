import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  return session
}

export async function requireAdmin(session: Session): Promise<NextResponse | null> {
  if ((session.user as { rol?: string })?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}

export async function requireTecnico(session: Session): Promise<NextResponse | null> {
  if ((session.user as { rol?: string })?.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}