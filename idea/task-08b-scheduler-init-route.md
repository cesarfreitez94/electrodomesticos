# TASK-08b · API route para inicializar scheduler manualmente

> **Grupo funcional:** Scheduler
> **Referencia TASK principal:** TASK-08 (scheduler de recordatorios)
> **Referencia SDD:** § 1

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-08b — API route para inicializar scheduler |
| Estimación | XS (15-30 min) |
| Prioridad | Baja — solo si se usa PM2 |
| Tipo | Backend |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

Permite que PM2 haga un `reload` de la aplicación Next.js sin reiniciar el scheduler. El scheduler corre dentro del proceso Next.js; un API route dedicado permite inicializarlo de forma independiente sin afectar otras partes del sistema.

---

## Lo que hay que hacer

### Crear `app/api/scheduler/init/route.ts`

```typescript
import { handlers } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { iniciarScheduler } from '@/lib/scheduler'

export const { GET } = handlers(async () => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No permitido en producción' }, { status: 403 })
  }
  iniciarScheduler()
  return NextResponse.json({ status: 'Scheduler iniciado' })
})
```

---

## Criterio de aceptación

- [ ] `app/api/scheduler/init/route.ts` existe y responde a GET
- [ ] Retorna 403 en producción
- [ ] Llama a `iniciarScheduler()` en desarrollo

---

## Dependencias

- Requiere: TASK-08 (scheduler core)

---

## Notas para el ejecutor

- Solo tiene sentido si se usa PM2 para gestionar el proceso Next.js
- Si no usas PM2 o no necesitas control granular, esta task no es necesaria

---

*Fin de TASK-08b*