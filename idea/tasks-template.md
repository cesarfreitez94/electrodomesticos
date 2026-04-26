# TASKS: [Nombre del Sistema o Feature]

> **Instrucciones para el LLM agente de tasks:**
> Este documento se genera a partir de un SDD aprobado. Tu rol es convertir el diseño técnico
> en unidades de trabajo concretas, atómicas y ordenadas que un desarrollador pueda ejecutar
> sin necesidad de leer el PRD ni el SDD.
>
> **Reglas de generación:**
> - Cada task debe ser autocontenida: incluye todo el contexto necesario para ejecutarla
> - Una task = máximo 1 día de trabajo de un desarrollador
> - Si una task depende de otra, decláralo explícitamente — nunca lo asumas
> - Agrupa por funcionalidad de negocio, no por tipo técnico
> - No generes tasks de secciones marcadas `[PENDIENTE]` en el SDD
> - Si detectas ambigüedad en el SDD que impide generar una task correctamente, márcala como `🚫 BLOQUEADA` y especifica qué falta
>
> **Flujo del pipeline:**
> `PRD (qué y por qué)` → `SDD (cómo)` → `Tasks (quién hace qué)` → `Desarrollo`
> Este documento es el último paso antes del desarrollo. No diseña — ejecuta lo que el SDD definió.

---

## Metadatos

| Campo              | Valor                          |
|--------------------|--------------------------------|
| Versión            | 1.0                            |
| Fecha              | YYYY-MM-DD                     |
| Generado por       | [Agente / Nombre]              |
| Estado             | Draft / En revisión / Listo    |
| SDD de referencia  | [Nombre o link del SDD]        |
| PRD de referencia  | [Nombre o link del PRD]        |
| Total de tasks     | [N]                            |
| Estimación total   | [N puntos / N días]            |

---

## Resumen de funcionalidades

> **Índice de los grupos de tasks. Se completa al finalizar la generación.**

| # | Funcionalidad              | Tasks | Estimación | Estado        |
|---|----------------------------|-------|------------|---------------|
| 1 | [Nombre funcionalidad]     | [N]   | [S/M/L]    | Pendiente     |
| 2 | [Nombre funcionalidad]     | [N]   | [S/M/L]    | Pendiente     |
| 3 | [Nombre funcionalidad]     | [N]   | [S/M/L]    | Pendiente     |

---

## Escala de estimación

> **Referencia fija para todo el documento. No cambiar por proyecto.**

| Talla | Tiempo estimado     | Criterio                                              |
|-------|---------------------|-------------------------------------------------------|
| XS    | < 2 horas           | Cambio trivial, configuración, fix puntual            |
| S     | 2–4 horas           | Una funcionalidad simple, un endpoint con lógica baja |
| M     | 4–8 horas (1 día)   | Funcionalidad con lógica media, múltiples capas       |
| L     | > 1 día             | **Debe subdividirse antes de asignarse**              |

---

## Tasks por funcionalidad

> **Orden de generación recomendado:**
> 1. Setup e infraestructura
> 2. Modelo de datos y migraciones
> 3. Lógica de negocio y reglas críticas
> 4. Interfaces (endpoints / UI)
> 5. Manejo de errores
> 6. Seguridad
> 7. Tests

---

### 🗂️ [FUNCIONALIDAD-1] [Nombre — ej: Autenticación de usuarios]

> Referencia SDD: [Sección del SDD que origina estas tasks]
> Referencia PRD: [RF-XX, RN-XX que cubre]

---

#### TASK-001 · [Título en verbo infinitivo — ej: Crear modelo de datos de Usuario]

| Campo           | Valor                                      |
|-----------------|--------------------------------------------|
| Funcionalidad   | [FUNCIONALIDAD-1]                          |
| Estimación      | XS / S / M                                |
| Prioridad       | Alta / Media / Baja                        |
| Tipo            | Backend / Frontend / DB / Infra / Test / Full-stack |
| Estado          | Pendiente / En progreso / Bloqueada / Lista |
| Asignado a      | [Nombre o `[SIN ASIGNAR]`]                 |

**Contexto:**
[Por qué existe esta task. Referencia directa al SDD o PRD. Una sola vez — no repetir lo que ya dice el título.]

**Lo que hay que hacer:**
- [ ] [Paso concreto 1]
- [ ] [Paso concreto 2]
- [ ] [Paso concreto 3]

**Criterio de aceptación:**
> La task está completa cuando:
- [ ] [Condición testeable 1 — ej: El endpoint POST /api/v1/users retorna 201 con el body correcto]
- [ ] [Condición testeable 2]
- [ ] [Condición testeable 3]

**Dependencias:**
- Requiere: [TASK-XXX] — [razón] *(omitir si no tiene)*
- Bloquea: [TASK-XXX] — [razón] *(omitir si no tiene)*

**Referencias:**
- SDD § [sección]: [link o nombre]
- PRD RF-XX / RN-XX

---

#### TASK-002 · [Título]

| Campo           | Valor      |
|-----------------|------------|
| Funcionalidad   | [FUNCIONALIDAD-1] |
| Estimación      | XS / S / M |
| Prioridad       | Alta / Media / Baja |
| Tipo            | Backend / Frontend / DB / Infra / Test / Full-stack |
| Estado          | Pendiente  |
| Asignado a      | [SIN ASIGNAR] |

**Contexto:**
[...]

**Lo que hay que hacer:**
- [ ] [...]
- [ ] [...]

**Criterio de aceptación:**
- [ ] [...]
- [ ] [...]

**Dependencias:**
- Requiere: [TASK-001]
- Bloquea: [TASK-003]

**Referencias:**
- SDD § [sección]

---

### 🗂️ [FUNCIONALIDAD-2] [Nombre]

> Referencia SDD: [Sección]
> Referencia PRD: [RF-XX]

---

#### TASK-003 · [Título]

*(repetir estructura)*

---

## Tasks bloqueadas

> **Tasks que no pudieron generarse por ambigüedad o información faltante en el SDD.**
> El agente de tasks debe completar esta sección antes de entregar el documento.

| Task ID tentativo | Funcionalidad    | Motivo del bloqueo                              | Sección SDD afectada |
|-------------------|------------------|-------------------------------------------------|----------------------|
| TASK-XXX          | [Funcionalidad]  | [Qué información falta para poder generarla]    | SDD § [N]            |

---

## Tasks diferidas

> **Tasks identificadas pero fuera del scope de esta iteración.**
> Se documentan aquí para no perderse — no deben ejecutarse ahora.

| Descripción                         | Motivo de diferimiento           | Referencia          |
|-------------------------------------|----------------------------------|---------------------|
| [Ej: Migración de datos históricos] | Out of scope del PRD v1.0        | PRD § Alcance       |
| [Task diferida 2]                   | [Razón]                          | [Referencia]        |

---

## Orden de ejecución sugerido

> **Secuencia recomendada respetando dependencias. Se genera automáticamente al finalizar todas las tasks.**

```
TASK-001 → TASK-002 → TASK-004
                    ↘ TASK-005 → TASK-007
TASK-003 ──────────────────────↗
```

> Nota: Tasks sin dependencias pueden ejecutarse en paralelo.

---

## Checklist de entrega

> **Antes de pasar este documento al equipo de desarrollo:**

- [ ] Todas las tasks tienen criterio de aceptación testeable
- [ ] Ninguna task tiene estimación L (si la hay, subdividir)
- [ ] Las dependencias están declaradas en ambas direcciones (requiere / bloquea)
- [ ] Las tasks bloqueadas están documentadas con motivo claro
- [ ] El orden de ejecución es coherente con las dependencias
- [ ] Cada task referencia su sección del SDD y RF/RN del PRD
- [ ] El resumen de funcionalidades al inicio está actualizado

---

*Fin del documento de tasks. El siguiente paso es asignación y desarrollo.*
