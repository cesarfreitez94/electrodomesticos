# TASK-01 · Inicializar proyecto Next.js con todas las dependencias

> **Grupo funcional:** Setup e Infraestructura
> **Referencia SDD:** § 1 (Contexto Técnico), § 10 (Estructura de Carpetas)
> **Referencia PRD:** RF-01 a RF-18 (contexto del sitio público), RNF (performance, responsive, accesibilidad)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-01 — Inicialización del proyecto |
| Estimación | S (2–4 horas) |
| Prioridad | Alta — bloquea todas las demás |
| Tipo | Infra / Full-stack |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El proyecto no existe todavía. Hay que crear la base del proyecto Next.js 14 con App Router, TypeScript, y todas las dependencias definidas en el SDD § 1 antes de escribir una sola línea de lógica de negocio. Esta task es prerrequisito absoluto para todo lo demás.

---

## Lo que hay que hacer

### 1. Crear proyecto Next.js 14 con App Router

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --turbopack
```

Responder prompts:
- TypeScript: `Yes`
- Tailwind: `Yes`
- ESLint: `Yes`
- App Router: `Yes`
- Turbopack: `Yes`
- Tailwind CSS UI component library: `No` (se instala shadcn manualmente después)

### 2. Instalar dependencias del proyecto

```bash
# Framework y runtime
npm install next@14 react react-dom

# Lenguaje
npm install -D typescript @types/react @types/node

# Base de datos
npm install prisma @prisma/client

# Autenticación
npm install next-auth@beta @auth/prisma-adapter

# Estado y data fetching
npm install zustand @tanstack/react-query

# Formularios y validación
npm install react-hook-form @hookform/resolvers zod

# Email
npm install resend @react-email/components

# Scheduler
npm install node-cron @types/node-cron

# Calendario
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# UI
npm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init
# Responder con defaults (slate, base)
npx shadcn@latest add button card dialog input label select textarea badge alert table dropdown-menu separator tabs toast
```

### 3. Crear estructura de carpetas inicial

```
/
├── app/
│   ├── (public)/
│   ├── (admin)/
│   ├── (tecnico)/
│   └── api/
├── components/
│   ├── ui/
│   ├── public/
│   ├── admin/
│   └── tecnico/
├── lib/
├── emails/
├── prisma/
└── store/
```

Crear los archivos `layout.tsx` vacíos o mínimos para cada grupo de rutas para evitar errores de compilación.

### 4. Configurar TypeScript

Revisar `tsconfig.json` — asegurar que:
- `path aliases` apunten a `@/*` correctamente (o sin alias según preferencia)
- `strict: true` esté activo

### 5. Configurar Tailwind

Revisar `tailwind.config.ts`:
- `content` incluya `app/**/*` y `components/**/*`
- Extender theme si es necesario (colores, fuentes)

### 6. Crear archivo `.env.example`

Documentar todas las variables de entorno requeridas según SDD § 11:

```bash
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/electrodomesticos"

# Auth.js
NEXTAUTH_SECRET="string-aleatorio-minimo-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@dominio.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 7. Configurar Prisma

Crear el archivo `prisma/schema.prisma` con la estructura completa del SDD § 3. Por ahora solo el schema — las migraciones se hacen en TASK-02.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Todas las entidades del SDD § 3 van aquí
// (se implementan en TASK-02, pero el schema puede quedar como esqueleto)
```

### 8. Configurar Auth.js (sin lógica de login aún — solo el cliente)

Crear `lib/auth.ts` con la configuración base de Auth.js v5 con Credentials provider. No implementar login todavía — solo la estructura del provider para que el proyecto compile.

### 9. Crear cliente Prisma singleton

Crear `lib/prisma.ts` con el singleton de Prisma Client.

### 10. Crear cliente Resend singleton

Crear `lib/resend.ts` con el cliente de Resend configurado.

### 11. Crear store de Zustand para agendamiento

Crear `store/agendamiento.ts` con el store vacío (las validaciones y campos del multi-paso se implementan en TASK-09).

### 12. Configurar next.config.js

- Agregar headers de seguridad: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- Configurar imágenes externas si es necesario

### 13. Configurar `middleware.ts` básico

Crear `middleware.ts` con la estructura mínima que exporte `config` de matcher vacío (la lógica de protección se implementa en TASK-03 y TASK-04).

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] El proyecto compila sin errores (`npm run build` exitoso)
- [ ] La estructura de carpetas coincide con el SDD § 10
- [ ] Todas las dependencias están instaladas y son importables
- [ ] `.env.example` existe con todas las variables documentadas
- [ ] `lib/prisma.ts` y `lib/resend.ts` exportan sus clientes correctamente
- [ ] `lib/auth.ts` tiene la configuración base de Auth.js v5 (sin login aún)
- [ ] `prisma/schema.prisma` tiene el esqueleto de todas las entidades
- [ ] `middleware.ts` existe y compila sin errores
- [ ] Las rutas `/(public)`, `/(admin)`, `/(tecnico)` responden con un layout básico (aunque sea un div vacío o "Hello")
- [ ] El sitio público ( `/`) carga en `localhost:3000`

---

## Dependencias

- No requiere ninguna task previa — es la primera
- Bloquea: TASK-02 (Prisma) — sin el schema definido no se pueden generar migraciones
- Bloquea: TASK-03 (Auth) — necesita el proyecto base para instalar next-auth
- Bloquea: TASK-04 (Middleware) — necesita Next.js configurado
- Bloquea: Todas las tasks restantes — todo depende del setup

---

## Notas para el ejecutor

- Si `npx create-next-app` pregunta por el nombre del proyecto, responder con el nombre del directorio actual o `electrodomesticos`
- shadcn/ui se configura con `npx shadcn@latest init` — responder los prompts con defaults (slate como color, yes a CSS variables)
- El `prisma/schema.prisma` en esta task solo lleva el esqueleto de las entidades — las relaciones y campos detallados se completan en TASK-02
- No implementar ninguna lógica de negocio todavía — solo la estructura del proyecto

---

## Checklist de cierre

- [ ] `npm run build` pasa sin errores
- [ ] `git status` muestra solo archivos nuevos del setup (no archivos de negocio)
- [ ] `.env.example` está documentado con todas las variables del SDD § 11

---

*Fin de TASK-01. Siguiente: TASK-02 — Modelo de datos Prisma + migraciones*