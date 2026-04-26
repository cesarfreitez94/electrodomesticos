import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const resendClient = resend

export async function enviarEmail(
  to: string,
  subject: string,
  html: string,
  _tipo: string,
  _citaId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@electrodomesticos.cl',
      to,
      subject,
      html,
    })

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
