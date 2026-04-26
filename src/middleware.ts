import { auth } from '@/lib/auth'

export default auth((_req) => {
  return Response.json({ ok: true })
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
