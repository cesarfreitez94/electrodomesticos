# TASK-13 · Construir API + UI del backoffice Admin — CRUDs (técnicos, servicios, repuestos, categorías, regiones/ciudades)

> **Grupo funcional:** Backoffice — CRUDs
> **Referencia SDD:** § 4.1 (Todos los endpoints admin: técnicos, servicios, repuestos, categorías, regiones/ciudades)
> **Referencia PRD:** RF-21 (servicios), RF-22 (sub-productos), RF-23 (precio masivo), RF-24 (repuestos), RF-25 (técnicos), RF-26 (asociación N:N), RF-27 (regiones/ciudades)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-13 — CRUDs Admin |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea TASK-14 (notificaciones), TASK-15 (configuración) |
| Tipo | Full-stack (API + UI) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

Se implementan los CRUDs completos de las 6 entidades del backoffice: técnicos (con asociación N:N a ciudades), servicios (con sub-productos y atributos), repuestos, categorías, y regiones/ciudades. Cada entidad tiene su API REST y su UI de listado y formularios. La UI sigue el patrón del admin layout ya creado en TASK-10.

**Agrupación por entidad:**

| Entidad | API | UI |
|---|---|---|
| Técnicos | 5 endpoints | Listado + detalle |
| Servicios + Sub-productos | 7 endpoints | Listado + detalle + precio masivo |
| Repuestos | 4 endpoints | Listado |
| Categorías | 4 endpoints | Listado |
| Regiones/Ciudades | 6 endpoints | Listado + detalle |

---

## Lo que hay que hacer

### 1. API — Técnicos

#### GET `/api/v1/admin/tecnicos`

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'

export const { GET } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const tecnicos = await prisma.user.findMany({
    where: { rol: 'tecnico' },
    include: {
      tecnicoCiudades: {
        include: { ciudad: { include: { region: true } } },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    tecnicos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      email: t.email,
      activo: t.activo,
      ciudades: t.tecnicoCiudades.map((tc) => ({
        id: tc.ciudad.id,
        nombre: tc.ciudad.nombre,
        region: tc.ciudad.region.nombre,
      })),
    }))
  )
})
```

#### POST `/api/v1/admin/tecnicos`

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/api-helpers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createSchema = z.object({
  nombre: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  ciudad_ids: z.array(z.string().uuid()).optional().default([]),
})

export const { POST } = handlers(async (req) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 422 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  const tecnico = await prisma.user.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: 'tecnico',
      tecnicoCiudades: {
        create: parsed.data.ciudad_ids.map((ciudadId) => ({ ciudadId })),
      },
    },
    include: { tecnicoCiudades: { include: { ciudad: true } } },
  })

  return NextResponse.json({ id: tecnico.id, nombre: tecnico.nombre, email: tecnico.email }, { status: 201 })
})
```

#### GET `/api/v1/admin/tecnicos/:id`

```typescript
export const { GET } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params

  const tecnico = await prisma.user.findUnique({
    where: { id },
    include: {
      tecnicoCiudades: { include: { ciudad: { include: { region: true } } } },
    },
  })

  if (!tecnico || tecnico.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: tecnico.id,
    nombre: tecnico.nombre,
    email: tecnico.email,
    activo: tecnico.activo,
    ciudades: tecnico.tecnicoCiudades.map((tc) => ({ id: tc.ciudad.id, nombre: tc.ciudad.nombre, region: tc.ciudad.region.nombre })),
  })
})
```

#### PUT `/api/v1/admin/tecnicos/:id`

```typescript
const updateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  activo: z.boolean().optional(),
})

export const { PUT } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  // igual que POST pero con update en lugar de create
  // Validar email único si cambia
  // Hash password solo si se incluye
})
```

#### DELETE `/api/v1/admin/tecnicos/:id`

Soft delete: `activo = false`

```typescript
export const { DELETE } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params
  const tecnico = await prisma.user.findUnique({ where: { id } })

  if (!tecnico || tecnico.rol !== 'tecnico') {
    return NextResponse.json({ error: 'Técnico no encontrado' }, { status: 404 })
  }

  await prisma.user.update({
    where: { id },
    data: { activo: false },
  })

  return NextResponse.json({ ok: true })
})
```

#### PUT `/api/v1/admin/tecnicos/:id/ciudades`

Actualizar asociación N:N de ciudades

```typescript
const ciudadesSchema = z.object({
  ciudad_ids: z.array(z.string().uuid()),
})

export const { PUT } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireAuth()
  if (session instanceof NextResponse) return session
  const forbidden = await requireAdmin(session)
  if (forbidden) return forbidden

  const { id } = await params
  const { ciudad_ids } = ciudadesSchema.parse(await req.json())

  await prisma.$transaction([
    prisma.tecnicoCiudad.deleteMany({ where: { tecnicoId: id } }),
    prisma.tecnicoCiudad.createMany({
      data: ciudad_ids.map((ciudadId) => ({ tecnicoId: id, ciudadId })),
    }),
  ])

  return NextResponse.json({ ok: true })
})
```

### 2. API — Servicios + Sub-productos

#### GET `/api/v1/admin/servicios`

```typescript
export const { GET } = handlers(async () => {
  const servicios = await prisma.servicio.findMany({
    include: { categoria: true, subProductos: { where: { activo: true } } },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria.nombre,
      precio_mantenimiento: Number(s.precioMantenimiento),
      activo: s.activo,
      sub_productos_count: s.subProductos.length,
    }))
  )
})
```

#### POST `/api/v1/admin/servicios`

```typescript
const servicioSchema = z.object({
  nombre: z.string().max(150),
  categoria_id: z.string().uuid(),
  descripcion: z.string(),
  precio_mantenimiento: z.number().positive(),
})

export const { POST } = handlers(async (req) => {
  // Crear servicio con los campos
})
```

#### GET `/api/v1/admin/servicios/:id`

Retorna detalle con sub-productos y atributos

#### PUT `/api/v1/admin/servicios/:id`

#### DELETE `/api/v1/admin/servicios/:id`

Soft delete: `activo = false`

#### POST `/api/v1/admin/servicios/:id/sub-productos`

```typescript
const subProductoSchema = z.object({
  nombre: z.string().max(150),
  precio: z.number().positive(),
  atributos: z.array(z.object({
    nombre: z.string().max(100),
    tipo: z.enum(['texto', 'numero', 'seleccion']),
    opciones: z.array(z.string()).optional(),
  })).optional().default([]),
})

export const { POST } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  // Crear sub-producto con atributos
})
```

#### PUT `/api/v1/admin/sub-productos/:id`

```typescript
export const { PUT } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  // Update nombre, precio, atributos
})
```

#### DELETE `/api/v1/admin/sub-productos/:id`

```typescript
export const { DELETE } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await prisma.subProducto.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
})
```

#### PATCH `/api/v1/admin/sub-productos/precio-masivo`

```typescript
const precioMasivoSchema = z.object({
  sub_producto_ids: z.array(z.string().uuid()).min(1),
  precio: z.number().positive(),
})

export const { PATCH } = handlers(async (req) => {
  const { sub_producto_ids, precio } = precioMasivoSchema.parse(await req.json())

  await prisma.subProducto.updateMany({
    where: { id: { in: sub_producto_ids } },
    data: { precio },
  })

  return NextResponse.json({ ok: true, updated: sub_producto_ids.length })
})
```

### 3. API — Repuestos

#### GET `/api/v1/admin/repuestos`
#### POST `/api/v1/admin/repuestos`
#### PUT `/api/v1/admin/repuestos/:id`
#### DELETE `/api/v1/admin/repuestos/:id`

```typescript
const repuestoSchema = z.object({
  nombre: z.string().max(150),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid(),
  disponible: z.boolean().optional().default(true),
})
```

### 4. API — Categorías

#### GET `/api/v1/admin/categorias`
#### POST `/api/v1/admin/categorias`
#### PUT `/api/v1/admin/categorias/:id`
#### DELETE `/api/v1/admin/categorias/:id`

```typescript
const categoriaSchema = z.object({
  nombre: z.string().max(100),
})
```

### 5. API — Regiones y Ciudades

#### GET `/api/v1/admin/regiones`

```typescript
export const { GET } = handlers(async () => {
  const regiones = await prisma.region.findMany({
    include: {
      ciudades: {
        include: { _count: { select: { tecnicoCiudad: true } } },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(regiones.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    ciudades: r.ciudades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      habilitada: c.habilitada,
      suspendida: c.suspendida,
      tecnicos_count: c._count.tecnicoCiudad,
    })),
  })))
})
```

#### POST `/api/v1/admin/regiones`

```typescript
const regionSchema = z.object({ nombre: z.string().max(100) })
```

#### GET `/api/v1/admin/ciudades`

Listado plano de ciudades

#### POST `/api/v1/admin/ciudades`

```typescript
const ciudadSchema = z.object({
  nombre: z.string().max(100),
  region_id: z.string().uuid(),
})
```

#### PATCH `/api/v1/admin/ciudades/:id/habilitada`

```typescript
const habilitadaSchema = z.object({ habilitada: z.boolean() })

export const { PATCH } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { habilitada } = habilitadaSchema.parse(await req.json())

  await prisma.ciudad.update({ where: { id }, data: { habilitada } })
  return NextResponse.json({ ok: true })
})
```

#### PATCH `/api/v1/admin/ciudades/:id/suspendida`

```typescript
const suspendidaSchema = z.object({ suspendida: z.boolean() })

export const { PATCH } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { suspendida } = suspendidaSchema.parse(await req.json())

  // Al suspender, la ciudad desaparece del selector público
  await prisma.ciudad.update({ where: { id }, data: { suspendida } })
  return NextResponse.json({ ok: true })
})
```

### 6. UI — Páginas de listado

Crear `app/(admin)/tecnicos/page.tsx`, `app/(admin)/servicios/page.tsx`, `app/(admin)/repuestos/page.tsx`, `app/(admin)/categorias/page.tsx`, `app/(admin)/geografico/page.tsx`

Cada página sigue el patrón:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState([])

  useEffect(() => {
    fetch('/api/v1/admin/tecnicos')
      .then((r) => r.json())
      .then(setTecnicos)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <Button>Nuevo técnico</Button>
      </div>

      <div className="grid gap-4">
        {tecnicos.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{t.nombre}</p>
                  <p className="text-sm text-gray-500">{t.email}</p>
                  <p className="text-sm text-gray-500">
                    Ciudades: {t.ciudades.map((c: any) => c.nombre).join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={t.activo ? 'default' : 'secondary'}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Button variant="outline" size="sm">Editar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

Repetir estructura similar para servicios, repuestos, categorías.

### 7. UI — Página de geográfica

`app/(admin)/geografico/page.tsx` muestra regiones con sus ciudades expandibles, con badges de habilitada/suspendida y contadores de técnicos.

### 8. Actualizar sidebar del admin layout

Agregar links faltantes:

```tsx
<SidebarLink href="/admin/tecnicos" label="Técnicos" />
<SidebarLink href="/admin/servicios" label="Servicios" />
<SidebarLink href="/admin/repuestos" label="Repuestos" />
<SidebarLink href="/admin/categorias" label="Categorías" />
<SidebarLink href="/admin/geografico" label="Regiones / Ciudades" />
```

### 9. Verificar que compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET/POST/PUT/DELETE de técnicos funciona con asociación N:N a ciudades
- [ ] GET/POST/PUT/DELETE de servicios funciona con sub-productos
- [ ] PATCH precio-masivo actualiza varios sub-productos a la vez
- [ ] GET/POST/PUT/DELETE de repuestos funciona
- [ ] GET/POST/PUT/DELETE de categorías funciona
- [ ] GET/POST de regiones funciona
- [ ] GET/POST de ciudades funciona
- [ ] PATCH habilitada/suspendida de ciudad funciona
- [ ] Todas las páginas de listado muestran datos desde la API
- [ ] El sidebar del admin tiene links a técnicos, servicios, repuestos, categorías, geográfico
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-10 (layout del admin)
- Bloquea: TASK-14 (notificaciones) y TASK-15 (configuración) — comparten el layout

---

## Notas para el ejecutor

- Las páginas de listado son `'use client'` porque usan `useEffect` para fetchar datos
- No crear páginas de detalle/edit para todas las entidades en esta task — las páginas de listado con botón "Editar" que abre un Dialog con el formulario es suficiente para el MVP
- El soft delete (activo = false) aplica a técnicos, servicios y repuestos. Categorías y regiones se eliminan permanentemente si no tienen entidades asociadas
- Para el CRUD de servicios con sub-productos, crear un Dialog que permita agregar sub-productos y sus atributos dentro de la misma página de detalle del servicio

---

## Checklist de cierre

- [ ] API CRUD de las 6 entidades funcionando
- [ ] PATCH precio-masivo de sub-productos funcional
- [ ] PATCH suspendida de ciudad funcional
- [ ] UI de listado de las 5 secciones del admin
- [ ] Sidebar actualizado con todos los links
- [ ] `npm run build` exitoso

---

*Fin de TASK-13. Siguiente: TASK-14 — Notificaciones del backoffice Admin*