# TASK-03 · Configurar autenticación Auth.js v5 con Credentials

> **Grupo funcional:** Autenticación y autorización
> **Referencia SDD:** § 1 (Stack — Auth.js v5), § 4.1 (Endpoints de autenticación), § 7 (Seguridad)
> **Referencia PRD:** RF-19, RF-41, RN-09, RN-10

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-03 — Autenticación Auth.js v5 |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea todo el backoffice y portal técnico |
| Tipo | Backend |
| Estado | ~~Pendiente~~ → **COMPLETA** |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

Auth.js v5 (NextAuth) se configura con Credentials provider para login con email y contraseña. Las contraseñas se hashean con bcrypt (cost factor 12). La sesión se almacena como JWT en una cookie httpOnly con SameSite=Strict y expiración de 8 horas (configurable). Esta task solo cubre la configuración del sistema de auth y la página de login público — la protección de rutas con middleware viene en TASK-04.

---

## Lo que hay que hacer

### 1. Instalar dependencias necesarias

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 2. Completar `lib/auth.ts`

Reemplazar el archivo `lib/auth.ts` (creado como esqueleto en TASK-01) con la configuración completa de Auth.js v5 con Credentials provider y bcrypt.

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.activo) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as any).rol
        token.nombre = (user as any).nombre
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as string
        session.user.nombre = token.nombre as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
})
```

### 3. Actualizar tipos de NextAuth

Crear o actualizar `types/next-auth.d.ts` para que TypeScript sepa los campos extra en la sesión:

```typescript
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: 'admin' | 'tecnico'
      nombre: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: 'admin' | 'tecnico'
    nombre: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: 'admin' | 'tecnico'
    nombre: string
  }
}
```

### 4. Crear el handler de Auth.js en la ruta de la API

Crear `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

### 5. Crear la página de login `/app/login/page.tsx`

Página pública en `/login` con el formulario de login:

- Campos: email, contraseña
- Validación con React Hook Form + Zod
- Llamada a `signIn('credentials', { email, password, callbackUrl })`
- Mensaje de error si las credenciales son inválidas
- Redirección tras login exitoso (admin → `/admin/dashboard`, técnico → `/tecnico/citas`)
- Diseño limpio, responsive (shadcn/ui: Card, Input, Label, Button)
- **No revelar si el email existe o no** en el mensaje de error — mostrar siempre "Credenciales incorrectas"
- Protección contra timing attacks: la comparación de contraseña ya la hace bcrypt.compare, que es safe

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      callbackUrl,
      redirect: false,
    })

    if (result?.error) {
      setError('Credenciales incorrectas')
    } else if (result?.url) {
      router.push(result.url)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 6. Implementar bloqueo por intentos fallidos (RN-10)

Crear `lib/login-attempts.ts` con el sistema de bloqueo por IP + email:

```typescript
// Mapa en memoria: email → { count, blockedUntil }
const attempts = new Map<string, { count: number; blockedUntil: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutos

export function recordFailedAttempt(email: string): boolean {
  const now = Date.now()
  const record = attempts.get(email)

  if (!record) {
    attempts.set(email, { count: 1, blockedUntil: 0 })
    return false
  }

  if (record.blockedUntil > now) {
    return true // sigue bloqueado
  }

  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
    return true
  }

  return false
}

export function clearAttempts(email: string): void {
  attempts.delete(email)
}

export function isBlocked(email: string): { blocked: boolean; remainingMinutes: number } {
  const record = attempts.get(email)
  if (!record) return { blocked: false, remainingMinutes: 0 }

  const now = Date.now()
  if (record.blockedUntil <= now) {
    attempts.delete(email)
    return { blocked: false, remainingMinutes: 0 }
  }

  const remaining = Math.ceil((record.blockedUntil - now) / 60000)
  return { blocked: true, remainingMinutes: remaining }
}
```

Integrar en `lib/auth.ts` dentro de `authorize`. Si `isBlocked(email)` retorna true, rechazar con mensaje "Tu cuenta está bloqueada temporalmente. Intenta nuevamente en X minutos". Si la login es exitosa, llamar `clearAttempts(email)`.

### 7. Crear endpoint de signout

El handler de Auth.js en `app/api/auth/[...nextauth]/route.ts` ya expone GET y POST para signout. No se necesita endpoint adicional.

### 8. Actualizar middleware.ts base (TASK-04 — se prepara el terreno)

Por ahora solo crear `middleware.ts` que exporte la config de matcher vacío para que compile. La lógica de protección viene en TASK-04.

### 9. Verificar que todo compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [x] `lib/auth.ts` exporta `auth`, `signIn`, `signOut`, `handlers`
- [x] `app/api/auth/[...nextauth]/route.ts` exporta GET y POST
- [x] La página `/login` existe y renderiza el formulario
- [x] Login con credenciales válidas redirige al callbackUrl (admin → `/admin/dashboard`, técnico → `/tecnico/citas`)
- [x] Login con credenciales inválidas muestra "Credenciales incorrectas" (sin revelar si el email existe)
- [x] Tras 5 intentos fallidos, el sistema muestra "Tu cuenta está bloqueada. Intenta en X minutos"
- [x] El JWT contiene `id`, `rol` y `nombre` del usuario
- [x] La sesión en el cliente tiene acceso a `session.user.id`, `session.user.rol`, `session.user.nombre`
- [x] `npm run build` pasa sin errores
- [x] No hay contraseñas en texto plano en la base de datos — todas son hash bcrypt

---

## Dependencias

- Requiere: TASK-01 (estructura del proyecto), TASK-02 (schema Prisma con modelo User)
- Bloquea: TASK-04 (middleware de protección de rutas) — necesita la auth configurada para probar
- Bloquea: TASK-05 (API pública) — necesita la sesión de auth para endpoints protegidos
- Bloquea: TASK-09 (sitio público UI) — necesita el login页
- Bloquea: TASK-10 a TASK-16 (todo el backoffice y portal técnico)

---

## Notas para el ejecutor

- Auth.js v5 está en beta (`next-auth@beta`). La API puede cambiar — consultar la documentación oficial si hay errores de compilación
- ElCredentials provider **no permite persistencia de sesión** en el cliente (no se puede usar `useSession` con Providers que requieren búsqueda en BD en cada request). La estrategia de sesión es `jwt`, no `database`
- El bloqueo por intentos fallidos usa mapa en memoria — se reinicia si el servidor se reinicia. Para producción más robusta, considerar persistir en Redis o en la BD. En v1 con mapa en memoria es aceptable según el SDD
- El hash bcrypt con cost factor 12 puede ser lento en tests — considerar reducir a 10 para entorno de desarrollo en `lib/auth.ts` (con comentario `// cost 10 solo en dev`)
- Los campos `id`, `rol`, `nombre` en el JWT se agregan en los callbacks `jwt` y `session` de Auth.js — no usar `session.user.email` como identificador porque el email está en el token, no en la sesión

---

## Checklist de cierre

- [x] Login con usuario admin redirecciona a `/admin/dashboard`
- [x] Login con usuario técnico redirecciona a `/tecnico/citas`
- [x] Credenciales inválidas muestran error genérico
- [x] 5 intentos fallidos bloquean 15 minutos
- [x] `npm run build` exitoso
- [x] Tipo `Session` incluye `user.id`, `user.rol`, `user.nombre`

---

*Fin de TASK-03. Siguiente: TASK-04 — Middleware de protección de rutas por rol*