# PRD: [Nombre del Producto o Feature]

> **Instrucciones para el LLM:**
> Este documento es un Product Requirements Document (PRD) estructurado.
> Tu tarea es leerlo completo antes de actuar, respetar el scope definido,
> y usar los flujos principales como base para cualquier output técnico (SDD, tasks, código).
> Si alguna sección está incompleta o marcada con `[PENDIENTE]`, detente y solicítala antes de continuar.

---

## Metadatos

| Campo         | Valor                        |
|---------------|------------------------------|
| Versión       | 1.0                          |
| Fecha         | YYYY-MM-DD                   |
| Autor         | [Nombre]                     |
| Estado        | Draft / En revisión / Aprobado |
| Producto      | [Nombre del producto]        |

---

## 1. Contexto y Problema

> **Por qué existe este PRD.**
> Describe el problema real, no la solución. Si no puedes explicar el dolor sin mencionar una feature, reescríbelo.

- **Problema:** [Descripción clara del dolor o fricción que existe hoy]
- **A quién afecta:** [Rol o segmento específico]
- **Impacto actual:** [Qué pasa si no se resuelve — pérdida, ineficiencia, riesgo]
- **Por qué ahora:** [Contexto que hace urgente resolver esto hoy]

---

## 2. Objetivo

> **Un solo outcome medible. No outputs, no features. El cambio que quieres ver en el mundo.**

- **Objetivo principal:** [Verbo + métrica + plazo]
  - Ejemplo: "Reducir el tiempo de onboarding de 10 min a 3 min en 60 días"
- **Métrica principal:** [KPI que confirma que el objetivo se logró]

---

## 3. Usuarios

> **Para quién es esto. Máximo 2 perfiles. Sin necesidad de personas completas, solo contexto accionable.**

### Usuario primario
- **Rol:** [Ej: Coordinador de operaciones]
- **Contexto:** [Qué hace hoy, con qué herramientas, qué dolor tiene]
- **Caso de uso principal:** [La acción concreta que este PRD le habilita]

### Usuario secundario *(opcional)*
- **Rol:** [Ej: Manager que aprueba]
- **Contexto:** [Breve]
- **Caso de uso:** [Breve]

---

## 4. Propuesta de Valor

> **Por qué alguien usaría esto en lugar de lo que hace hoy.**

- **Qué mejora concreta ofrece:** [Resultado tangible para el usuario]
- **Cómo lo hacen hoy (alternativa actual):** [Workaround, herramienta existente, proceso manual]
- **Por qué esta solución es mejor:** [Diferencia específica, no genérica]

---

## 5. Alcance

> **El scope es un contrato. Lo que no está aquí no se construye en esta iteración.**

### ✅ In Scope
- [Funcionalidad 1]
- [Funcionalidad 2]
- [Funcionalidad 3]
- *(máximo 7 ítems)*

### ❌ Out of Scope
- [Lo que explícitamente NO se hará]
- [Feature relacionada que queda para después]
- [Integración que no aplica en esta versión]

---

## 6. Flujos Principales

> **Cómo funciona realmente. Sin UI detallada, sin mocks. Solo la lógica del happy path y los errores críticos.**
> **Formato: Actor → Acción → Sistema → Resultado**
> Cada flujo debe incluir al menos un estado de error o alterno mínimo.

### Flujo 1: [Nombre del flujo — ej: Registro de usuario]

**Happy path:**
1. El usuario [acción]
2. El sistema [respuesta]
3. El usuario [acción]
4. El sistema [resultado final]

**Estados de error / alternos:**
- Si [condición de fallo]: el sistema debe [comportamiento esperado]
- Si [condición de fallo]: el sistema debe [comportamiento esperado]

### Flujo 2: [Nombre del flujo] *(si aplica)*

**Happy path:**
1. ...

**Estados de error / alternos:**
- Si [...]: el sistema debe [...]

### Flujo 3: [Nombre del flujo] *(si aplica)*

**Happy path:**
1. ...

**Estados de error / alternos:**
- Si [...]: el sistema debe [...]

---

## 7. Requisitos Funcionales

> **Qué debe hacer el sistema. Cada ítem debe ser testeable y sin ambigüedad.**
> **Formato obligatorio y normalizado: `RF-XX: El sistema debe [verbo] [objeto] [condición]`**
> Usar siempre "El sistema debe" — nunca "El usuario puede" ni otras formas. Las acciones del usuario van en los Flujos (sección 6), no aquí.

- RF-01: El sistema debe [verbo] [objeto] [condición]
- RF-02: El sistema debe [verbo] [objeto] [condición]
- RF-03: El sistema debe validar [objeto] cuando [condición]
- RF-04: El sistema debe [...]

---

## 8. Requisitos No Funcionales

> **Solo incluir los que son realmente críticos para esta iteración. Omitir el resto.**

- **Performance:** [Ej: La respuesta debe ser < 2s en condiciones normales] *(si aplica)*
- **Seguridad:** [Ej: Los datos deben estar encriptados en tránsito] *(si aplica)*
- **Disponibilidad:** [Ej: 99.5% uptime] *(si aplica)*
- **Escalabilidad:** [Ej: Soportar hasta 1,000 usuarios concurrentes] *(si aplica)*

---

## 9. Dependencias Externas

> **Todo lo que este producto necesita de fuera para funcionar. Sin esto, el SDD no puede planificarse correctamente.**
> Incluir APIs, servicios de terceros, equipos internos, o sistemas existentes de los que depende esta iteración.

| Dependencia         | Tipo                        | Responsable       | Riesgo si no está disponible |
|---------------------|-----------------------------|-------------------|------------------------------|
| [Nombre del servicio o equipo] | API / Servicio / Equipo / Sistema | [Quién lo gestiona] | [Impacto concreto] |
| [Dependencia 2]     | ...                         | ...               | ...                          |

---

## 10. Métricas de Éxito

> **Cómo sabrás que esto funcionó. Alineadas con el objetivo de la sección 2.**

| Métrica           | Baseline actual | Meta      | Plazo   |
|-------------------|-----------------|-----------|---------|
| [KPI principal]   | [Valor hoy]     | [Valor]   | [Fecha] |
| [Métrica secundaria 1] | [Valor hoy] | [Valor] | [Fecha] |
| [Métrica secundaria 2] | [Valor hoy] | [Valor] | [Fecha] |

---

## 11. Riesgos y Supuestos

> **Dónde puede romperse esto. Ser honesto aquí evita sorpresas después.**

### Supuestos clave
- [Supuesto 1 — algo que asumes verdadero pero no has validado]
- [Supuesto 2]

### Riesgos
| Riesgo                        | Probabilidad | Impacto | Mitigación                  |
|-------------------------------|--------------|---------|-----------------------------|
| [Riesgo técnico o de adopción] | Alta/Media/Baja | Alto/Medio/Bajo | [Acción concreta] |
| [Riesgo 2]                    | ...          | ...     | ...                         |

---

## Checklist de completitud

> **Antes de entregar este PRD a un agente o equipo, verifica que puedas responder estas 3 preguntas solo con lo que está escrito aquí:**

- [ ] ¿Qué problema resolvemos y por qué importa?
- [ ] ¿Para quién es y cuál es su caso de uso principal?
- [ ] ¿Cómo sabremos que funcionó?

> Si no puedes responder las 3 con este documento, está incompleto.

---

*Fin del PRD. El siguiente paso es el SDD (Software Design Document).*
