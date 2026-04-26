import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const { allowed, remaining } = rateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
      { status: 429 }
    )
  }

  const _body = await req.json()

  return NextResponse.json(
    { message: 'Cita recibida', remaining },
    {
      status: 201,
      headers: { 'rateLimit-remaining': String(remaining) },
    }
  )
}