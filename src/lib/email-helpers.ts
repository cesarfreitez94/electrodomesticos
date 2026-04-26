import type { Cita, Servicio, Ciudad, User } from '@prisma/client'

export async function enviarConfirmacionCliente(
  _cita: Cita,
  _servicio: Servicio,
  _ciudad: Ciudad
): Promise<void> {
  console.log('[email-helpers] enviarConfirmacionCliente - TODO: implementar con resend')
}

export async function notificarTecnico(
  _cita: Cita,
  _servicio: Servicio,
  _tecnico: User,
  _ciudad: Ciudad
): Promise<void> {
  console.log('[email-helpers] notificarTecnico - TODO: implementar con resend')
}

export async function notificarEmergenciaAdmin(
  _cita: Cita,
  _servicio: Servicio,
  _ciudad: Ciudad
): Promise<void> {
  console.log('[email-helpers] notificarEmergenciaAdmin - TODO: implementar con resend')
}