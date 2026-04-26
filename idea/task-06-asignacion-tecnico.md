# TASK-06 · Implementar lógica de asignación automática de técnico + estado emergencia

> **Grupo funcional:** Lógica de negocio
> **Referencia SDD:** § 5 (RN-01, RN-02, RN-03, RN-04, RN-05)
> **Referencia PRD:** RF-09, RF-10, RF-30

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-06 — Asignación automática de técnico |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea POST /api/v1/public/citas (TASK-05) y emails (TASK-07) |
| Tipo | Backend (lógica pura, sin HTTP) |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

Este es código de lógica de negocio pura, sin endpoints HTTP ni UI. Se implementa en `lib/asignacion-tecnico.ts` y `lib/disponibilidad.ts`. Estas funciones son llamadas desde TASK-05 (API pública) y TASK-10 (gestión de citas del admin).

---

## Lo que hay que hacer

### 1. Crear `lib/asignacion-tecnico.ts`

Implementa RN-01 y RN-02:

```typescript
import { prisma } from '@/lib/prisma'

export interface AsignacionResult {
  tecnicoId: string | null
  esEmergencia: boolean
  razon?: string
}

/**
 * RN-01: Asigna el técnico con menor cantidad de citas activas
 * (confirmado o en_curso) en el slot de fecha/hora de la ciudad dada.
 * Si hay empate, elige por created_at más antiguo del usuario.
 *
 * RN-02: Si no hay técnico disponible o todos tienen conflicto,
 * retorna null y esEmergencia=true.
 */
export async function asignarTecnico(
  ciudadId: string,
  fechaHora: string | Date
): Promise<AsignacionResult> {
  const slotStart = new Date(fechaHora)
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000) // +1 hora

  // Obtener todos los técnicos asignados a esa ciudad que estén activos
  const tecnicosCiudad = await prisma.user.findMany({
    where: {
      rol: 'tecnico',
      activo: true,
      tecnicoCiudades: {
        some: { ciudadId },
      },
    },
    include: {
      citasTecnico: {
        where: {
          estado: { in: ['confirmado', 'en_curso'] },
          // Solo citas que se solapan con el slot solicitado
          fechaHora: {
            lt: slotEnd,
            gt: slotStart,
          },
        },
      },
    },
  })

  if (tecnicosCiudad.length === 0) {
    return { tecnicoId: null, esEmergencia: true, razon: 'No hay técnicos activos en esta ciudad' }
  }

  // Encontrar técnico con menos citas en ese slot
  let mejorTecnico: { id: string; count: number; createdAt: Date } | null = null

  for (const tecnico of tecnicosCiudad) {
    const count = tecnico.citasTecnico.length

    if (mejorTecnico === null) {
      mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
    } else if (count < mejorTecnico.count) {
      mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
    } else if (count === mejorTecnico.count) {
      // Empate: elegir por createdAt más antiguo
      if (tecnico.createdAt < mejorTecnico.createdAt) {
        mejorTecnico = { id: tecnico.id, count, createdAt: tecnico.createdAt }
      }
    }
  }

  // Si el mejor técnico tiene 0 citas, está totalmente disponible
  if (mejorTecnico && mejorTecnico.count === 0) {
    return { tecnicoId: mejorTecnico.id, esEmergencia: false }
  }

  // Si todos tienen citas en ese slot, es emergencia
  if (mejorTecnico && mejorTecnico.count > 0) {
    return {
      tecnicoId: null,
      esEmergencia: true,
      razon: 'Todos los técnicos tienen conflictos de horario en el slot seleccionado',
    }
  }

  return { tecnicoId: null, esEmergencia: true, razon: 'No se encontró técnico disponible' }
}

/**
 * Versión síncrona para testing — misma lógica pero sin async/await
 */
export function calcularCargaTecnico(
  tecnicos: Array<{
    id: string
    citasTecnico: Array<{ fechaHora: Date; estado: string }>
    createdAt: Date
  }>,
  slotStart: Date,
  slotEnd: Date
): { tecnicoId: string | null; count: number } {
  let mejor: { tecnicoId: string | null; count: number } = { tecnicoId: null, count: Infinity }

  for (const tecnico of tecnicos) {
    const count = tecnico.citasTecnico.filter((cita) => {
      const citaStart = new Date(cita.fechaHora)
      const citaEnd = new Date(citaStart.getTime() + 60 * 60 * 1000)
      return citaStart < slotEnd && citaEnd > slotStart
    }).length

    if (count < mejor.count) {
      mejor = { tecnicoId: tecnico.id, count }
    } else if (count === mejor.count && mejor.count !== Infinity) {
      // Empate: más antiguo gana
      const tecnicoCreado = tecnico.createdAt
      const mejorCreado = tecnicos.find((t) => t.id === mejor.tecnicoId)?.createdAt
      if (mejorCreado && tecnicoCreado < mejorCreado) {
        mejor = { tecnicoId: tecnico.id, count }
      }
    }
  }

  return mejor
}
```

### 2. Crear `lib/disponibilidad.ts`

Implementa RN-03 y RN-04:

```typescript
import { prisma } from '@/lib/prisma'

export interface FranjaHoraria {
  horaInicio: string // "09:00"
  horaFin: string     // "13:00"
}

export interface SlotDisponible {
  hora: string
  disponible: boolean
}

/**
 * RN-03: Calcula los slots disponibles para una ciudad y fecha.
 * Un slot está disponible si existe una franja activa en
 * disponibilidad_calendario para ese día de semana, y al menos
 * un técnico no tiene conflicto en ese horario.
 *
 * RN-04: No hay límite de citas por slot — múltiples técnicos
 * pueden atender en paralelo. Si hay al menos uno disponible,
 * el slot aparece como disponible.
 */
export async function calcularSlotsDisponibles(
  ciudadId: string,
  fecha: string // YYYY-MM-DD
): Promise<string[]> {
  const fechaDate = new Date(fecha)
  const jsDay = fechaDate.getDay()
  // Convertir: JS 0=Domingo → nuestra convención 0=Lunes, 6=Domingo
  const diaSemana = jsDay === 0 ? 6 : jsDay - 1

  // Obtener franjas activas para ese día de semana
  const franjas = await prisma.disponibilidadCalendario.findMany({
    where: { diaSemana, activo: true },
    orderBy: { horaInicio: 'asc' },
  })

  if (franjas.length === 0) return []

  // Obtener técnicos de la ciudad con sus citas del día
  const tecnicosCiudad = await prisma.user.findMany({
    where: {
      rol: 'tecnico',
      activo: true,
      tecnicoCiudades: { some: { ciudadId } },
    },
    include: {
      citasTecnico: {
        where: {
          fechaHora: {
            gte: new Date(`${fecha}T00:00:00`),
            lt: new Date(`${fecha}T23:59:59`),
          },
          estado: { in: ['confirmado', 'en_curso'] },
        },
      },
    },
  })

  const slots: string[] = []

  for (const franja of franjas) {
    const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number)
    const [finH, finM] = franja.horaFin.split(':').map(Number)

    let hour = inicioH
    let minute = inicioM

    while (hour < finH || (hour === finH && minute < finM)) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotStart = new Date(`${fecha}T${slotTime}:00`)
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

      // Verificar si al menos un técnico no tiene cita en ese slot
      const hayDisponible = tecnicosCiudad.some((tecnico) => {
        return !tecnico.citasTecnico.some((cita) => {
          const citaStart = new Date(cita.fechaHora)
          const citaEnd = new Date(citaStart.getTime() + 60 * 60 * 1000)
          // Conflicto: los slots se solapan
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

  return slots
}

/**
 * Verifica si un slot específico está disponible para una ciudad/fecha.
 * Útil para validar antes de crear la cita.
 */
export async function verificarSlotDisponible(
  ciudadId: string,
  fechaHora: string
): Promise<boolean> {
  const fecha = fechaHora.split('T')[0]
  const hora = fechaHora.split('T')[1].substring(0, 5)
  const slots = await calcularSlotsDisponibles(ciudadId, fecha)
  return slots.includes(hora)
}

/**
 * RN-05: Advertencia si se intenta deshabilitar un horario con citas confirmadas.
 * Retorna la cantidad de citas afectadas.
 */
export async function verificarCitasEnFranja(
  diaSemana: number,
  horaInicio: string,
  horaFin: string
): Promise<number> {
  // Obtener todas las citas en estado confirmado o en_curso
  // que caen dentro de esa franja horaria en cualquier fecha con ese día de semana
  const citas = await prisma.cita.findMany({
    where: {
      estado: { in: ['confirmado', 'en_curso'] },
    },
    include: {
      ciudad: true,
    },
  })

  // Filtrar las que coinciden con el día de semana y franja horaria
  let count = 0
  for (const cita of citas) {
    const fecha = new Date(cita.fechaHora)
    const jsDay = fecha.getDay()
    const citaDiaSemana = jsDay === 0 ? 6 : jsDay - 1

    if (citaDiaSemana !== diaSemana) continue

    const horaCita = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`

    if (horaCita >= horaInicio && horaCita < horaFin) {
      count++
    }
  }

  return count
}
```

### 3. Crear tests unitarios

Crear `__tests__/asignacion-tecnico.test.ts`:

```typescript
import { calcularCargaTecnico } from '@/lib/asignacion-tecnico'

describe('asignarTecnico', () => {
  it('asigna al técnico con menor carga', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [
          { fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' },
        ],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-02'),
        citasTecnico: [], // 0 citas — debería ser elegido
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t2')
    expect(result.count).toBe(0)
  })

  it('empate: elige el más antiguo', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-02'), // más nuevo
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-01'), // más antiguo — debería ganar
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t2')
  })

  it('todos con conflicto: retorna emergencia', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T10:00:00'), estado: 'confirmado' }],
      },
      {
        id: 't2',
        createdAt: new Date('2024-01-02'),
        citasTecnico: [{ fechaHora: new Date('2026-04-27T10:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T10:00:00')
    const slotEnd = new Date('2026-04-27T11:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBeNull()
  })

  it('slot que no se solapa con cita existente: disponible', () => {
    const tecnicos = [
      {
        id: 't1',
        createdAt: new Date('2024-01-01'),
        // Cita a las 09:00, slot a las 11:00 — no hay conflicto
        citasTecnico: [{ fechaHora: new Date('2026-04-27T09:00:00'), estado: 'confirmado' }],
      },
    ]

    const slotStart = new Date('2026-04-27T11:00:00')
    const slotEnd = new Date('2026-04-27T12:00:00')

    const result = calcularCargaTecnico(tecnicos, slotStart, slotEnd)
    expect(result.tecnicoId).toBe('t1')
    expect(result.count).toBe(0)
  })
})
```

Crear `__tests__/disponibilidad.test.ts`:

```typescript
// Los tests de disponibilidad requieren mock de Prisma
// o usar una base de datos de test.
// Por ahora se prueban los casos simples de lógica de franja.

describe('calcularSlotsDisponibles — lógica de franja', () => {
  it('genera slots de 1 hora dentro de la franja', () => {
    const franja = { horaInicio: '09:00', horaFin: '13:00' }
    const slots: string[] = []

    let hour = 9
    let minute = 0
    while (hour < 13 || (hour === 13 && minute < 0)) {
      if (hour < 13) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00'])
  })

  it('franja que empieza en hora y media', () => {
    const franja = { horaInicio: '09:30', horaFin: '13:30' }
    const slots: string[] = []

    let hour = 9
    let minute = 30
    while (hour < 13 || (hour === 13 && minute < 30)) {
      if (hour < 13 || (hour === 13 && minute < 30)) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
      minute += 60
      if (minute >= 60) {
        hour += Math.floor(minute / 60)
        minute = minute % 60
      }
    }

    expect(slots).toEqual(['09:30', '10:30', '11:30', '12:30'])
  })
})
```

### 4. Instalar Jest para tests

```bash
npm install -D jest @types/jest ts-jest
npx jest --init
```

Agregar a `jest.config.ts`:

```typescript
preset: 'ts-jest',
testMatch: ['**/__tests__/**/*.test.ts'],
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
},
```

### 5. Verificar que el código compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] `lib/asignacion-tecnico.ts` exporta `asignarTecnico` y `calcularCargaTecnico`
- [ ] `lib/disponibilidad.ts` exporta `calcularSlotsDisponibles`, `verificarSlotDisponible`, `verificarCitasEnFranja`
- [ ] `asignarTecnico(ciudadId, fechaHora)` retorna `{ tecnicoId, esEmergencia }` según RN-01 y RN-02
- [ ] `calcularSlotsDisponibles(ciudadId, fecha)` retorna array de strings `["09:00", "10:00", ...]` según RN-03 y RN-04
- [ ] Tests unitarios de `asignacion-tecnico.ts` pasan
- [ ] `npm run build` pasa sin errores en lib/ (los tests no necesitan pasar para el build)

---

## Dependencias

- Requiere: TASK-01, TASK-02 (Prisma schema con User, Ciudad, Cita)
- Bloquea: TASK-05 — `asignarTecnico` se llama desde POST `/api/v1/public/citas`
- Bloquea: TASK-07 — necesita `lib/email-helpers` que recibe `tecnicoId` de la asignación

---

## Notas para el ejecutor

- Estas funciones son **puras de lógica de negocio** — no hacen HTTP, no renderizan, no tienen副作用 más allá de la consulta a la BD
- Son las funciones más críticas del sistema según RN-01 a RN-04 — probar bien los casos: técnico con 0 citas, con 1 cita, con múltiples, empate, todos ocupados, ciudad sin técnicos
- `calcularCargaTecnico` es la versión sync de testing de `asignarTecnico`. Mantener ambas sincronizadas.
- La duración de la cita se asume como 1 hora en todos los cálculos (`+ 60 * 60 * 1000`). Si el negocio necesita duraciones variables, se diferiría a v2
- El timezone del servidor (Chile/Santiago) debe ser consistente. Usar UTC para todos los cálculos internos de fecha/hora si es posible

---

## Checklist de cierre

- [ ] `asignarTecnico` cumple RN-01 y RN-02 en todos los escenarios de test
- [ ] `calcularSlotsDisponibles` cumple RN-03 y RN-04
- [ ] Tests pasan: `npx jest`
- [ ] `npm run build` exitoso

---

*Fin de TASK-06. Siguiente: TASK-07 — Sistema de emails transaccionales con Resend + React Email*