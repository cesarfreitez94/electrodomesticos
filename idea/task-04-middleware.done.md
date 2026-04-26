# TASK-04 · Implementar middleware de protección de rutas por rol

> **Grupo funcional:** Autenticación y autorización
> **Referencia SDD:** § 4.1 (Rutas — todas las que requieren auth), § 7 (Seguridad — RBAC), § 10 (middleware.ts)
> **Referencia PRD:** RF-19 (admin se autentica), RF-41 (técnico se autentica), RN-11

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-04 — Middleware de protección de rutas |
| Estimación | S (2–4 horas) |
| Prioridad | Alta — bloquea el acceso al backoffice y portal técnico |
| Tipo | Backend / Infra |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El middleware de Next.js intercepta todas las requests y verifica que el usuario tenga sesión activa y el rol correspondiente antes de dejarlo acceder a rutas protegidas. Las reglas son: `/(admin)` y `/api/v1/admin/*` solo para rol `admin`; `/(tecnico)` y `/api/v1/tecnico/*` solo para rol `tecnico`. Requests sin sesión válidos son redirigidos a `/login`. Intentos de acceso cross-role (técnico accede a admin o viceversa) también son redirige­ctados a su ruta correspondiente.

---

## Lo que hay que hacer

### 1. Actualizar `middleware.ts` con la lógica de protección

Reemplazar el archivo `middleware.ts` (creado como esqueleto en TASK-01) con la lógica completa:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Rutas que requieren autenticación
const protectedRoutes = {
  admin: [
    '/admin',
    '/api/v1/admin',
  ],
  tecnico: [
    '/tecnico',
    '/api/v1/tecnico',
  ],
}

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/login',
  '/api/auth',
  '/api/v1/public',
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Si es ruta pública, permitir
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Si no tiene sesión y no es ruta pública, redirigir a login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(req.url))
    return NextResponse.redirect(loginUrl)
  }

  const userRol = (session.user as any)?.rol

  // Proteger rutas de admin
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/v1/admin')
  ) {
    if (userRol !== 'admin') {
      // Técnico intentando acceder a admin → redirigir a portal técnico
      if (userRol === 'tecnico') {
        return NextResponse.redirect(new URL('/tecnico/citas', req.url))
      }
      // Sin rol o rol desconocido → login
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Proteger rutas de técnico
  if (
    pathname.startsWith('/tecnico') ||
    pathname.startsWith('/api/v1/tecnico')
  ) {
    if (userRol !== 'tecnico') {
      // Admin intentando acceder a portal técnico → redirigir a dashboard
      if (userRol === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      // Sin rol o rol desconocido → login
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
      Interceptar todas las rutas EXCEPTO:
      - _next/static (archivos estáticos)
      - _next/image (optimización de imágenes)
      - favicon.ico
      - archivos públicos en /public
    */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. Verificar que el middleware compila correctamente

```bash
npm run build
```

El build debe incluir el middleware sin errores.

### 3. Implementar protección en las API routes del backoffice (doble verificación)

Crear un helper `lib/api-helpers.ts` que las API routes protected puedan usar para verificar el rol en cada request server-side (el middleware ya protege, pero como defense in depth):

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  return session
}

export async function requireAdmin(session: any) {
  if ((session.user as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}

export async function requireTecnico(session: any) {
  if ((session.user as any)?.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  return null
}
```

Este helper se usa en todas las API routes de admin y técnico como capa secundaria de protección.

### 4. Proteger todas las API routes existentes

Revisar todos los archivos en `app/api/v1/admin/` y `app/api/v1/tecnico/` e importar `requireAuth` + `requireAdmin`/`requireTecnico` al inicio de cada handler.

Ejemplo para una API route de admin:

```typescript
import { handlers } from '@/lib/auth'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session // error
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden // error 403

  // lógica de la route...
})
```

### 5. Verificar redirect behavior

Manual testing:
- Ir a `/admin/dashboard` sin sesión → redirige a `/login?callbackUrl=...`
- Login como técnico → redirige a `/tecnico/citas` (no a admin)
- Login como admin → redirige a `/admin/dashboard`
- Ir a `/tecnico/citas` como admin → redirige a `/admin/dashboard`
- Ir a `/admin/dashboard` como técnico → redirige a `/tecnico/citas`

### 6. Implementar rate limiting básico en POST `/api/v1/public/citas` (RN-13)

Crear `lib/rate-limit.ts`:

```typescript
const ipRequests = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000 // 1 minuto
const MAX_REQUESTS = 10

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = ipRequests.get(ip)

  if (!record || record.resetAt <= now) {
    ipRequests.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  record.count += 1

  if (record.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}
```

Integrar en el handler POST de `/api/v1/public/citas`:

```typescript
import { rateLimit } from '@/lib/rate-limit'

// Al inicio del handler:
const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
const { allowed, remaining } = rateLimit(ip)
if (!allowed) {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
    { status: 429 }
  )
}
```

El header `rateLimit-remaining` se puede agregar a la respuesta para debugging.

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] `/admin/*` sin sesión redirige a `/login?callbackUrl=...`
- [ ] `/admin/*` con sesión de técnico redirige a `/tecnico/citas`
- [ ] `/tecnico/*` sin sesión redirige a `/login?callbackUrl=...`
- [ ] `/tecnico/*` con sesión de admin redirige a `/admin/dashboard`
- [ ] `/api/v1/admin/*` sin sesión retorna 401
- [ ] `/api/v1/admin/*` con sesión de técnico retorna 403
- [ ] `/api/v1/tecnico/*` sin sesión retorna 401
- [ ] `/api/v1/tecnico/*` con sesión de admin retorna 403
- [ ] Rate limiting en POST `/api/v1/public/citas` retorna 429 tras 10 req/min desde la misma IP
- [ ] Todas las API routes protegidas tienen verificación de rol (defense in depth)
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01 (middleware.ts esqueleto), TASK-03 (auth configurado con usuarios)
- No bloquea tasks directamente — es un middleware que se activa cuando las otras tasks implementan las rutas. Pero sin él, el backoffice y portal técnico quedan expuestos.

---

## Notas para el ejecutor

- El middleware de Next.js usa Edge Runtime. Verificar que `lib/auth` no importe nada incompatible con Edge (como某些 Node.js-only packages). Prisma y bcryptjs son compatibil­es con Edge, pero verificar.
- El matcher del middleware es amplio (`'/(. *)'` excluyendo estáticos). Si causa problemas de rendimiento, afinar el matcher.
- Para testing del middleware, usar una extensión de browser o curl. En dev, el middleware se recarga sin necesidad de restart del servidor.
- El rate limiting en memoria es por IP. En producción con múltiples instancias del servidor, cada instancia tiene su propio mapa — considerar Redis si esto es un problema. Para v1 con un solo servidor, es aceptable.
- El helper `lib/api-helpers.ts` no es obligatorio para todas las API routes — solo para las que necesitan verificación programática del rol (GET con filtros, por ejemplo). El middleware ya hace la protección a nivel de ruta.
- Si Auth.js v5 beta tiene cambios en la API de `auth()`, verificar la documentación oficial. El patrón de exportar `export const { GET, POST } = handlers` es el estándar para v5.

---

## Checklist de cierre

- [ ] Todas las rutas admin protegido con redirect + 401/403 según contexto
- [ ] Todas las rutas técnico protegido con redirect + 401/403 según contexto
- [ ] Rate limiting 429 operativo en endpoint público de citas
- [ ] `npm run build` exitoso
- [ ] `lib/api-helpers.ts` creado y usable por todas las API routes

---

*Fin de TASK-04. Siguiente: TASK-05 — API pública: catálogo, disponibilidad y agendamiento*