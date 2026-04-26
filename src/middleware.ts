import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const publicRoutes = ['/login', '/api/auth', '/api/v1/public']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(req.url))
    return NextResponse.redirect(loginUrl)
  }

  const userRol = (session.user as { rol?: string })?.rol

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/v1/admin')
  ) {
    if (userRol !== 'admin') {
      if (userRol === 'tecnico') {
        return NextResponse.redirect(new URL('/tecnico/citas', req.url))
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (
    pathname.startsWith('/tecnico') ||
    pathname.startsWith('/api/v1/tecnico')
  ) {
    if (userRol !== 'tecnico') {
      if (userRol === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}