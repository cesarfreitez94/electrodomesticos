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
import type { Cita, Servicio, Ciudad, User } from '@prisma/client'

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

export async function enviarConfirmacionCliente(cita: Cita, servicio: Servicio, ciudad: Ciudad) {
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

export async function notificarTecnico(cita: Cita, servicio: Servicio, tecnico: User, ciudad: Ciudad) {
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

export async function enviarRecordatorio(cita: Cita, servicio: Servicio, ciudad: Ciudad, horasAntes: number) {
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

export async function notificarCancelacionCliente(cita: Cita, servicio: Servicio) {
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

export async function notificarEmergenciaAdmin(cita: Cita, servicio: Servicio, ciudad: Ciudad) {
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
    'Emergencia: Cita sin técnico asignado',
    html,
    'emergencia_admin',
    cita.id
  )
}