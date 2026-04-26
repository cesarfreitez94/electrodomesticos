import { z } from 'zod'
import { sanitizeStringSync } from './sanitize'

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