# TASK-07 · Implementar sistema de emails transaccionales con Resend + React Email

> **Grupo funcional:** Emails
> **Referencia SDD:** § 4.3 (Integraciones externas — Resend), § 5 (RN-08), § 10 (carpeta emails/)
> **Referencia PRD:** RF-11 (confirmación cliente), RF-12 (notificación técnico), RF-13 (emergencia admin), RF-35 (cancelación), RF-38 (recordatorios)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-07 — Emails transaccionales |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea TASK-08 (scheduler) |
| Tipo | Backend |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El sistema envía 5 tipos de emails transaccionales: confirmación de cita al cliente, notificación al técnico asignado, recordatorio de visita, cancelación de cita, y notificación de emergencia al admin. Se usa Resend como proveedor y React Email para las plantillas. Cada envío se registra en `historial_notificaciones`. Si el envío falla, el error se registra pero la operación principal (crear/actualizar cita) NO se revierte (RN-08).

---

## Lo que hay que hacer

### 1. Instalar dependencias de email

```bash
npm install resend react-email @react-email/components
```

### 2. Completar `lib/resend.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const resendClient = resend

export async function enviarEmail(
  to: string,
  subject: string,
  html: string,
  tipo: string,
  citaId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@electrodomesticos.cl',
      to,
      subject,
      html,
    })

    if (result.error) {
      await registrarNotificacionFallida(tipo, to, citaId, result.error.message)
      return { success: false, error: result.error.message }
    }

    await registrarNotificacionEnviada(tipo, to, citaId)
    return { success: true }
  } catch (err: any) {
    await registrarNotificacionFallida(tipo, to, citaId, err.message)
    return { success: false, error: err.message }
  }
}
```

### 3. Crear helper de registro de notificaciones

Crear `lib/notificacion-helper.ts`:

```typescript
import { prisma } from '@/lib/prisma'

export async function registrarNotificacionEnviada(
  tipo: string,
  destinatario: string,
  citaId?: string
) {
  await prisma.historialNotificacion.create({
    data: {
      citaId: citaId || null,
      tipo,
      destinatario,
      estado: 'enviado',
    },
  })
}

export async function registrarNotificacionFallida(
  tipo: string,
  destinatario: string,
  citaId: string | undefined,
  errorDetalle: string
) {
  await prisma.historialNotificacion.create({
    data: {
      citaId: citaId || null,
      tipo,
      destinatario,
      estado: 'fallido',
      errorDetalle,
    },
  })
}
```

### 4. Crear las 5 plantillas de email

#### `emails/ConfirmacionCita.tsx`

```tsx
import { Html, Head, Body, Container, Title, Text, Button,Hr, Section } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
  tecnicoNombre?: string
}

export function ConfirmacionCita({
  clienteNombre,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
  tecnicoNombre,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Title style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Confirmación de tu cita
          </Title>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {clienteNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Tu cita ha sido <strong>confirmada</strong>. Aquí están los detalles:
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{direccion}, {ciudad}</Text>

            {tecnicoNombre && (
              <>
                <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Técnico asignado</Text>
                <Text style={{ fontSize: '16px', color: '#111827' }}>{tecnicoNombre}</Text>
              </>
            )}
          </Section>

          <Hr style={{ margin: '32px 0', borderColor: '#e5e7eb' }} />

          <Text style={{ fontSize: '14px', color: '#6b7280' }}>
            Si necesitas reprogramar o cancelar, contacta a nuestro equipo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `emails/NotificacionTecnico.tsx`

```tsx
import { Html, Head, Body, Container, Title, Text, Button, Section } from '@react-email/components'

interface Props {
  tecnicoNombre: string
  clienteNombre: string
  clienteTelefono: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
}

export function NotificacionTecnico({
  tecnicoNombre,
  clienteNombre,
  clienteTelefono,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Title style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Nueva cita asignada
          </Title>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {tecnicoNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Se te ha asignado una nueva visita. Por favor revisa los detalles y confirma tu comprensión desde el portal técnico.
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Cliente</Text>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{clienteNombre} — {clienteTelefono}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{direccion}, {ciudad}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Accede al portal técnico para confirmar esta cita.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `emails/Recordatorio.tsx`

```tsx
import { Html, Head, Body, Container, Title, Text, Section } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
  horasAntes: number
}

export function Recordatorio({
  clienteNombre,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
  horasAntes,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Title style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Recordatorio de tu cita
          </Title>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {clienteNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Te recordamos que tienes una visita programada en aproximadamente <strong>{horasAntes} horas</strong>.
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{direccion}, {ciudad}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `emails/CancelacionCita.tsx`

```tsx
import { Html, Head, Body, Container, Title, Text, Section } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicioNombre: string
  fecha: string
  hora: string
}

export function CancelacionCita({
  clienteNombre,
  servicioNombre,
  fecha,
  hora,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Title style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Cancelación de tu cita
          </Title>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Hola {clienteNombre},
          </Text>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>:
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{fecha} a las {hora}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Puedes agendar una nueva cita desde nuestro sitio web cuando lo prefieras.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `emails/EmergenciaAdmin.tsx`

```tsx
import { Html, Head, Body, Container, Title, Text, Section, Button } from '@react-email/components'

interface Props {
  citaId: string
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string
  servicioNombre: string
  fecha: string
  hora: string
  direccion: string
  ciudad: string
}

export function EmergenciaAdmin({
  citaId,
  clienteNombre,
  clienteEmail,
  clienteTelefono,
  servicioNombre,
  fecha,
  hora,
  direccion,
  ciudad,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Title style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            🚨 Cita en estado de Emergencia
          </Title>

          <Text style={{ fontSize: '16px', color: '#374151', lineHeight: '24px' }}>
            Una nueva cita no pudo ser asignada automáticamente y requiere acción del administrador.
          </Text>

          <Section style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', marginTop: '24px', border: '2px solid #dc2626' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>ID de cita</Text>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{citaId}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Cliente</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{clienteNombre} — {clienteEmail} — {clienteTelefono}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Servicio</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{servicioNombre}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Fecha y hora</Text>
            <Text style={{ fontSize: '16px', color: '#111827', marginBottom: '16px' }}>{fecha} a las {hora}</Text>

            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Dirección</Text>
            <Text style={{ fontSize: '16px', color: '#111827' }}>{direccion}, {ciudad}</Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Revisa la cita en el backoffice y asigna un técnico manualmente o cancela la visita.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### 5. Crear `lib/email-helpers.ts`

Helper que combina las plantillas con Resend y el registro en historial:

```typescript
import { render } from '@react-email/components'
import { prisma } from '@/lib/prisma'
import { enviarEmail } from '@/lib/resend'
import {
  ConfirmacionCita,
  NotificacionTecnico,
  Recordatorio,
  CancelacionCita,
  EmergenciaAdmin,
} from '@/emails'

function formatearFecha(date: Date): string {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatearHora(date: Date): string {
  return date.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function enviarConfirmacionCliente(cita: any, servicio: any, ciudad: any) {
  const tecnico = cita.tecnicoId
    ? await prisma.user.findUnique({ where: { id: cita.tecnicoId } })
    : null

  const html = await render(
    ConfirmacionCita({
      clienteNombre: cita.clienteNombre,
      servicioNombre: servicio.nombre,
      fecha: formatearFecha(cita.fechaHora),
      hora: formatearHora(cita.fechaHora),
      direccion: cita.clienteDireccion,
      ciudad: ciudad.nombre,
      tecnicoNombre: tecnico?.nombre,
    })
  )

  await enviarEmail(
    cita.clienteEmail,
    'Confirmación de tu cita de mantenimiento',
    html,
    'confirmacion_cliente',
    cita.id
  )
}

export async function notificarTecnico(cita: any, servicio: any, tecnico: any, ciudad: any) {
  const html = await render(
    NotificacionTecnico({
      tecnicoNombre: tecnico.nombre,
      clienteNombre: cita.clienteNombre,
      clienteTelefono: cita.clienteTelefono,
      servicioNombre: servicio.nombre,
      fecha: formatearFecha(cita.fechaHora),
      hora: formatearHora(cita.fechaHora),
      direccion: cita.clienteDireccion,
      ciudad: ciudad.nombre,
    })
  )

  await enviarEmail(
    tecnico.email,
    'Nueva cita asignada — Revisa los detalles',
    html,
    'notif_tecnico',
    cita.id
  )
}

export async function enviarRecordatorio(cita: any, servicio: any, ciudad: any, horasAntes: number) {
  const html = await render(
    Recordatorio({
      clienteNombre: cita.clienteNombre,
      servicioNombre: servicio.nombre,
      fecha: formatearFecha(cita.fechaHora),
      hora: formatearHora(cita.fechaHora),
      direccion: cita.clienteDireccion,
      ciudad: ciudad.nombre,
      horasAntes,
    })
  )

  await enviarEmail(
    cita.clienteEmail,
    `Recordatorio: Tu visita es en ${horasAntes} horas`,
    html,
    'recordatorio',
    cita.id
  )
}

export async function notificarCancelacionCliente(cita: any, servicio: any) {
  const html = await render(
    CancelacionCita({
      clienteNombre: cita.clienteNombre,
      servicioNombre: servicio.nombre,
      fecha: formatearFecha(cita.fechaHora),
      hora: formatearHora(cita.fechaHora),
    })
  )

  await enviarEmail(
    cita.clienteEmail,
    'Tu cita ha sido cancelada',
    html,
    'cancelacion',
    cita.id
  )
}

export async function notificarEmergenciaAdmin(cita: any, servicio: any, ciudad: any) {
  // Obtener el email del admin
  const admin = await prisma.user.findFirst({
    where: { rol: 'admin', activo: true },
  })

  if (!admin) return

  const html = await render(
    EmergenciaAdmin({
      citaId: cita.id,
      clienteNombre: cita.clienteNombre,
      clienteEmail: cita.clienteEmail,
      clienteTelefono: cita.clienteTelefono,
      servicioNombre: servicio.nombre,
      fecha: formatearFecha(cita.fechaHora),
      hora: formatearHora(cita.fechaHora),
      direccion: cita.clienteDireccion,
      ciudad: ciudad.nombre,
    })
  )

  await enviarEmail(
    admin.email,
    '🚨 Emergencia: Cita sin técnico asignado',
    html,
    'emergencia_admin',
    cita.id
  )
}
```

### 6. Actualizar `lib/resend.ts` para usar el helper de registro

Reemplazar el contenido de `lib/resend.ts` para incluir el import del helper de notificaciones:

```typescript
import { Resend } from 'resend'
import { registrarNotificacionEnviada, registrarNotificacionFallida } from '@/lib/notificacion-helper'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarEmail(
  to: string,
  subject: string,
  html: string,
  tipo: string,
  citaId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@electrodomesticos.cl',
      to,
      subject,
      html,
    })

    if (result.error) {
      await registrarNotificacionFallida(tipo, to, citaId, result.error.message)
      return { success: false, error: result.error.message }
    }

    await registrarNotificacionEnviada(tipo, to, citaId)
    return { success: true }
  } catch (err: any) {
    await registrarNotificacionFallida(tipo, to, citaId, err.message)
    return { success: false, error: err.message }
  }
}
```

### 7. Verificar que todo compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] Las 5 plantillas de email existen en `emails/` y renderizan HTML correctamente
- [ ] `enviarEmail(to, subject, html, tipo, citaId)` envía el email vía Resend y registra en `historial_notificaciones`
- [ ] `enviarConfirmacionCliente(cita, servicio, ciudad)` — confirma al cliente
- [ ] `notificarTecnico(cita, servicio, tecnico, ciudad)` — notifica al técnico
- [ ] `enviarRecordatorio(cita, servicio, ciudad, horasAntes)` — envía recordatorio
- [ ] `notificarCancelacionCliente(cita, servicio)` — cancela al cliente
- [ ] `notificarEmergenciaAdmin(cita, servicio, ciudad)` — notifica al admin
- [ ] Si el envío falla, se registra en `historial_notificaciones` con `estado=fallido` y `error_detalle`
- [ ] El fallo de email NO revierte la operación principal (cita creada/actualizada)
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01 (dependencias), TASK-02 (modelo de datos con `historial_notificaciones`)
- Bloquea: TASK-05 — la API de citas llama a `enviarConfirmacionCliente`, `notificarTecnico`, `notificarEmergenciaAdmin`
- Bloquea: TASK-08 — el scheduler llama a `enviarRecordatorio`

---

## Notas para el ejecutor

- Resend requiere que el dominio esté verificado. En desarrollo se puede usar el dominio de pruebas de Resend (`resend.dev`)
- React Email renderiza los emails en el servidor — no usar hooks ni estado
- La variable `RESEND_FROM_EMAIL` en `.env` debe ser del dominio verificado
- Para testing local sin Resend real, se puede mockear la función `enviarEmail` para que solo registre en BD sin llamar a la API
- Los emails usan estilos inline porque la mayoría de clientes de email no soportan CSS externo

---

## Checklist de cierre

- [ ] 5 plantillas en `/emails/`
- [ ] `lib/email-helpers.ts` exporta las 5 funciones de envío
- [ ] `lib/resend.ts` integra registro en `historial_notificaciones`
- [ ] `npm run build` exitoso

---

*Fin de TASK-07. Siguiente: TASK-08 — Scheduler de recordatorios con node-cron*