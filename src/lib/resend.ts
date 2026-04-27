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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await registrarNotificacionFallida(tipo, to, citaId, message)
    return { success: false, error: message }
  }
}