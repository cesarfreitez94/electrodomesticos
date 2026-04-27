# TASK-05 · Implementar API pública — Catálogo, disponibilidad y agendamiento

> **Grupo funcional:** API pública
> **Referencia SDD:** § 4.1 (Endpoints públicos), § 5 (Lógica de negocio RN-01 a RN-05, RN-12)
> **Referencia PRD:** RF-01 a RF-18 (sitio público), RF-06 a RF-12

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-05 — API pública |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea la UI del sitio público (TASK-09) y los emails (TASK-07) |
| Tipo | Backend |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

La API pública es el backend del sitio público. Expone endpoints para que el frontend consulte el catálogo de servicios y repuestos, las ciudades habilitadas, los horarios disponibles para una ciudad/fecha, y el endpoint para crear una nueva cita. Todos los inputs se validan con Zod y sanitizan antes de persistir (RN-12). El endpoint de creación de cita integra la lógica de asignación de técnico (TASK-06) y envía los emails de confirmación (TASK-07). Esta task solo cubre la API — la UI viene en TASK-09.

---

## Lo que hay que hacer

### 1. Crear helper de sanitización

Crear `lib/sanitize.ts`:

```typescript
import DOMPurify from 'dompurify'

// Solo en server-side
let purify: typeof DOMPurify | null = null

export async function sanitizeString(input: string): Promise<string> {
  if (!input || typeof input !== 'string') return ''

  // Si DOMPurify no está cargado, hacer sanitización manual básica
  return input
    .replace(/<[^>]*>/g, '') // strip tags HTML
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
    .replace(/\s+/g, ' ') // normalizar espacios múltiples
}

// Versión síncrona para usar en contexts donde async no está disponible
export function sanitizeStringSync(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
    .replace(/\s+/g, ' ')
}
```

Instalar DOMPurify:

```bash
npm install dompurify
npm install -D @types/dompurify
```

### 2. Crear schemas de validación Zod para la API pública

Crear `lib/validations.ts` con los schemas compartidos entre API y frontend:

```typescript
import { z } from 'zod'

export const agendarSchema = z.object({
  servicio_id: z.string().uuid('ID de servicio inválido'),
  repuesto_ids: z.array(z.string().uuid()).optional().default([]),
  cliente_nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .transform(sanitizeStringSync),
  cliente_email: z
    .string()
    .email('Email inválido')
    .max(255),
  cliente_telefono: z
    .string()
    .min(7, 'Teléfono demasiado corto')
    .max(20, 'Teléfono demasiado largo')
    .regex(/^[0-9+\-() ]+$/, 'Teléfono contiene caracteres inválidos'),
  cliente_direccion: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .transform(sanitizeStringSync),
  ciudad_id: z.string().uuid('ID de ciudad inválido'),
  fecha_hora: z
    .string()
    .datetime('Fecha inválida')
    .refine(
      (date) => new Date(date) > new Date(),
      'La fecha debe ser futura'
    ),
})

export type AgendarInput = z.infer<typeof agendarSchema>
```

### 3. GET `/api/v1/public/servicios` — Listar servicios activos

Crear `app/api/v1/public/servicios/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async () => {
  const servicios = await prisma.servicio.findMany({
    where: { activo: true },
    include: {
      categoria: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria.nombre,
      categoria_id: s.categoria.id,
      precio_mantenimiento: Number(s.precioMantenimiento),
      descripcion_breve: s.descripcion.substring(0, 120),
    }))
  )
})
```

### 4. GET `/api/v1/public/servicios/:id` — Detalle completo con sub-productos

Crear `app/api/v1/public/servicios/[id]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const servicio = await prisma.servicio.findUnique({
    where: { id, activo: true },
    include: {
      categoria: { select: { id: true, nombre: true } },
      subProductos: {
        where: { activo: true },
        include: {
          atributos: true,
        },
      },
    },
  })

  if (!servicio) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: servicio.id,
    nombre: servicio.nombre,
    categoria: servicio.categoria.nombre,
    categoria_id: servicio.categoria.id,
    descripcion: servicio.descripcion,
    precio_mantenimiento: Number(servicio.precioMantenimiento),
    sub_productos: servicio.subProductos.map((sp) => ({
      id: sp.id,
      nombre: sp.nombre,
      precio: Number(sp.precio),
      atributos: sp.atributos.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tipo: a.tipo,
        opciones: a.opciones,
      })),
    })),
  })
})
```

### 5. GET `/api/v1/public/repuestos` — Listar repuestos por categoría

Crear `app/api/v1/public/repuestos/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async () => {
  const repuestos = await prisma.repuesto.findMany({
    where: { disponible: true },
    include: {
      categoria: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  // Agrupar por categoría
  const grouped = repuestos.reduce((acc, r) => {
    const catNombre = r.categoria.nombre
    if (!acc[catNombre]) acc[catNombre] = []
    acc[catNombre].push({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
    })
    return acc
  }, {} as Record<string, { id: string; nombre: string; descripcion: string | null }[]>)

  return NextResponse.json(grouped)
})
```

### 6. GET `/api/v1/public/ciudades` — Listar ciudades habilitadas

Crear `app/api/v1/public/ciudades/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async () => {
  const ciudades = await prisma.ciudad.findMany({
    where: {
      habilitada: true,
      suspendida: false,
    },
    include: {
      region: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(
    ciudades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      region: c.region.nombre,
      region_id: c.region.id,
    }))
  )
})
```

### 7. GET `/api/v1/public/disponibilidad` — Horarios disponibles

Crear `app/api/v1/public/disponibilidad/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async (req) => {
  const { searchParams } = new URL(req.url)
  const ciudadId = searchParams.get('ciudad_id')
  const fechaStr = searchParams.get('fecha') // YYYY-MM-DD

  if (!ciudadId || !fechaStr) {
    return NextResponse.json(
      { error: 'ciudad_id y fecha son requeridos' },
      { status: 400 }
    )
  }

  // Validar que la fecha sea parseable
  const fecha = new Date(fechaStr)
  if (isNaN(fecha.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  // Obtener día de la semana (0=Lunes ... 6=Domingo)
  // JavaScript: 0=Domingo, 1=Lunes...
  const jsDay = fecha.getDay()
  const diaSemana = jsDay === 0 ? 6 : jsDay - 1 // convertir a 0=Lunes

  // Obtener franjas horarias activas para ese día
  const franjas = await prisma.disponibilidadCalendario.findMany({
    where: {
      diaSemana,
      activo: true,
    },
    orderBy: { horaInicio: 'asc' },
  })

  if (franjas.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  // Obtener técnicos activos en esa ciudad
  const tecnicosCiudad = await prisma.tecnicoCiudad.findMany({
    where: { ciudadId },
    include: {
      tecnico: {
        include: {
          citasTecnico: {
            where: {
              fechaHora: {
                gte: new Date(`${fechaStr}T00:00:00`),
                lt: new Date(`${fechaStr}T23:59:59`),
              },
              estado: { in: ['confirmado', 'en_curso'] },
            },
          },
        },
      },
    },
  })

  // Para cada franja, verificar si hay al menos un técnico disponible
  const slots: string[] = []

  for (const franja of franjas) {
    const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number)
    const [finH, finM] = franja.horaFin.split(':').map(Number)

    // Generar slots de 1 hora dentro de la franja
    let hour = inicioH
    let minute = inicioM

    while (hour < finH || (hour === finH && minute < finM)) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

      // Verificar si al menos un técnico no tiene cita en ese slot
      const hayDisponible = tecnicosCiudad.some(({ tecnico }) => {
        const slotStart = new Date(`${fechaStr}T${slotTime}:00`)
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

        return !tecnico.citasTecnico.some((cita) => {
          const citaStart = new Date(cita.fechaHora)
          const citaEnd = new Date(citaStart.getTime() + 60 * 60 * 1000)
          return slotStart < citaEnd && slotEnd > citaStart
        })
      })

      if (hayDisponible) {
        slots.push(slotTime)
      }

      // Avanzar 1 hora
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }
  }

  return NextResponse.json({ slots })
})
```

### 8. POST `/api/v1/public/citas` — Crear nueva cita

Crear `app/api/v1/public/citas/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { agendarSchema } from '@/lib/validations'
import { sanitizeStringSync } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { asignarTecnico } from '@/lib/asignacion-tecnico'
import { enviarConfirmacionCliente, notificarTecnico, notificarEmergenciaAdmin } from '@/lib/email-helpers'

export const { POST } = handlers(async (req) => {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
      { status: 429 }
    )
  }

  // Parsear body
  const body = await req.json()
  const parsed = agendarSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Verificar que la ciudad existe, está habilitada y no suspendida
  const ciudad = await prisma.ciudad.findUnique({
    where: { id: data.ciudad_id },
  })

  if (!ciudad || !ciudad.habilitada || ciudad.suspendida) {
    return NextResponse.json(
      { error: 'El servicio no está disponible en la ciudad seleccionada' },
      { status: 422 }
    )
  }

  // Verificar que el servicio existe y está activo
  const servicio = await prisma.servicio.findUnique({
    where: { id: data.servicio_id, activo: true },
  })

  if (!servicio) {
    return NextResponse.json(
      { error: 'Servicio no disponible' },
      { status: 422 }
    )
  }

  // Verificar que la fecha/hora está disponible
  const disponibilidadResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/public/disponibilidad?ciudad_id=${data.ciudad_id}&fecha=${data.fecha_hora.split('T')[0]}`,
    { cache: 'no-store' }
  )
  const { slots } = await disponibilidadResponse.json()

  const hourStr = data.fecha_hora.split('T')[1].substring(0, 5)
  if (!slots.includes(hourStr)) {
    return NextResponse.json(
      { error: 'El horario seleccionado ya no está disponible. Por favor elige otro horario' },
      { status: 422 }
    )
  }

  // Intentar asignar técnico (RN-01, RN-02)
  const { tecnicoId, esEmergencia } = await asignarTecnico(data.ciudad_id, data.fecha_hora)

  // Crear la cita
  const cita = await prisma.cita.create({
    data: {
      servicioId: data.servicio_id,
      tecnicoId: tecnicoId,
      ciudadId: data.ciudad_id,
      clienteNombre: data.cliente_nombre,
      clienteEmail: data.cliente_email,
      clienteTelefono: data.cliente_telefono,
      clienteDireccion: data.cliente_direccion,
      fechaHora: new Date(data.fecha_hora),
      estado: esEmergencia ? 'emergencia' : 'confirmado',
    },
  })

  // Asociar repuestos si hay
  if (data.repuesto_ids && data.repuesto_ids.length > 0) {
    await prisma.citaRepuesto.createMany({
      data: data.repuesto_ids.map((repuestoId) => ({
        citaId: cita.id,
        repuestoId,
      })),
    })
  }

  // Enviar emails (no bloquea la creación de la cita)
  if (esEmergencia) {
    // Notificar admin
    await notificarEmergenciaAdmin(cita, servicio, ciudad)
  } else if (tecnicoId) {
    // Confirmación al cliente
    await enviarConfirmacionCliente(cita, servicio, ciudad)
    // Notificación al técnico
    const tecnico = await prisma.user.findUnique({ where: { id: tecnicoId } })
    if (tecnico) {
      await notificarTecnico(cita, servicio, tecnico, ciudad)
    }
  }

  return NextResponse.json(
    {
      cita_id: cita.id,
      estado: esEmergencia ? 'emergencia' : 'confirmado',
      mensaje: esEmergencia
        ? 'Tu solicitud fue recibida y será confirmada pronto'
        : 'Tu cita ha sido confirmada exitosamente',
    },
    { status: 201 }
  )
})
```

### 9. GET `/api/v1/public/redes-sociales` — Redes sociales activas

Crear `app/api/v1/public/redes-sociales/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async () => {
  const redes = await prisma.redSocial.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  })

  return NextResponse.json(
    redes.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      url: r.url,
      icono: r.icono,
    }))
  )
})
```

### 10. GET `/api/v1/public/configuracion` — Horario de atención

Crear `app/api/v1/public/configuracion/route.ts`:

```typescript
import { handlers } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const { GET } = handlers(async () => {
  const configs = await prisma.configuracionSistema.findMany({
    where: { clave: { in: ['horario_atencion_inicio', 'horario_atencion_fin', 'horario_atencion_dias'] } },
  })

  const map = configs.reduce((acc, c) => {
    acc[c.clave] = c.valor
    return acc
  }, {} as Record<string, string>)

  // Calcular si está dentro del horario de atención
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // 0=Lunes
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  let disponible = false
  if (map['horario_atencion_dias']) {
    const diasHabilitados = JSON.parse(map['horario_atencion_dias'])
    if (diasHabilitados.includes(dayOfWeek)) {
      const inicio = map['horario_atencion_inicio'] || '09:00'
      const fin = map['horario_atencion_fin'] || '18:00'
      disponible = currentTime >= inicio && currentTime <= fin
    }
  }

  return NextResponse.json({
    horario_inicio: map['horario_atencion_inicio'] || '09:00',
    horario_fin: map['horario_atencion_fin'] || '18:00',
    dias_habilitados: map['horario_atencion_dias']
      ? JSON.parse(map['horario_atencion_dias'])
      : [1, 2, 3, 4, 5],
    disponible,
  })
})
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] GET `/api/v1/public/servicios` retorna lista de servicios activos con categoría y precio
- [ ] GET `/api/v1/public/servicios/:id` retorna detalle con sub-productos y atributos
- [ ] GET `/api/v1/public/repuestos` retorna repuestos agrupados por categoría
- [ ] GET `/api/v1/public/ciudades` retorna solo ciudades habilitadas y no suspendidas
- [ ] GET `/api/v1/public/disponibilidad?ciudad_id=&fecha=` retorna slots disponibles para esa fecha
- [ ] POST `/api/v1/public/citas` crea la cita, asigna técnico por menor carga, retorna 201 con `cita_id` y `estado`
- [ ] POST `/api/v1/public/citas` con ciudad suspendida retorna 422
- [ ] POST `/api/v1/public/citas` con campos inválidos retorna 400 con errores por campo
- [ ] POST `/api/v1/public/citas` sin técnico disponible crea la cita en estado `emergencia`
- [ ] GET `/api/v1/public/redes-sociales` retorna redes activas ordenadas
- [ ] GET `/api/v1/public/configuracion` retorna horario de atención y si está disponible ahora
- [ ] Rate limiting: 429 tras 10 req/min a POST `/api/v1/public/citas`
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01, TASK-02 (modelo de datos), TASK-03 (auth), TASK-06 (lógica de asignación de técnico)
- Bloquea: TASK-06 — necesita los endpoints de disponibilidad para calcular asignación
- Bloquea: TASK-07 — necesita la función `enviarConfirmacionCliente`, `notificarTecnico`, `notificarEmergenciaAdmin`
- Bloquea: TASK-09 — necesita todos los endpoints del sitio público

---

## Notas para el ejecutor

- `lib/asignacion-tecnico` se implementa en TASK-06 — hasta entonces, el endpoint de POST citas puede usar una versión mock o llamar directamente a la lógica cuando esté lista
- `lib/email-helpers` se implementa en TASK-07 — hasta entonces, los envíos pueden ser `// TODO` que no rompen el flujo (la cita se crea igual)
- La validación Zod del schema `agendarSchema` incluye `.transform(sanitizeStringSync)` en los campos de texto — la sanitización ocurre automáticamente al parsear
- No usar `DOMPurify` en el servidor para sanitización sync — usar la versión manual `sanitizeStringSync` que no requiere window/object
- La fecha/hora del slot se calcula con `new Date(`${fechaStr}T${slotTime}:00`)` — verificar zona horaria del servidor (Chile/Santiago)

---

## Checklist de cierre

- [ ] Los 6 endpoints públicos responden correctamente
- [ ] Validación de Zod retorna errores por campo (400)
- [ ] Ciudad suspendida retorna 422
- [ ] Slot no disponible retorna 422
- [ ] Cita en emergencia se crea correctamente
- [ ] Rate limiting operativo
- [ ] `npm run build` exitoso

---

*Fin de TASK-05. Siguiente: TASK-06 — Lógica de asignación automática de técnico + estado emergencia*