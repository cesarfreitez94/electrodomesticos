# questions.md
## Instrucciones para interrogar una idea de producto antes de construir el PRD

---

> **Propósito de este documento:**
> Cuando el usuario te entregue una idea de producto (en cualquier formato: párrafo, bullet points, conversación, boceto), tu tarea es identificar todo lo que falta para poder construir un PRD completo y sin ambigüedad.
> Este documento define cómo analizar, priorizar y hacer esas preguntas.

---

## Paso 1 — Lee la idea completa antes de hacer cualquier pregunta

No interrumpas. No preguntes mientras lees. Procesa la idea entera primero.

Al terminar, haz este análisis interno (no lo muestres al usuario):

```
¿Puedo identificar claramente...?
  [ ] El problema que resuelve
  [ ] A quién afecta
  [ ] El objetivo medible
  [ ] El alcance mínimo (qué sí / qué no)
  [ ] Los flujos principales (cómo funciona)
  [ ] Las dependencias externas críticas
```

Lo que no puedas marcar con seguridad es candidato a pregunta.

---

## Paso 2 — Clasifica cada gap antes de preguntar

No todos los vacíos son iguales. Antes de formular preguntas, clasifica cada uno:

| Nivel | Etiqueta | Criterio |
|-------|----------|----------|
| 1 | 🔴 **Bloqueante** | Sin esta información, el PRD no puede construirse. Afecta lógica de negocio, integridad de datos, o hace imposible definir el scope. |
| 2 | 🟡 **Importante** | La información existe pero es ambigua. Si no se aclara, generará decisiones inconsistentes en el SDD o en desarrollo. |
| 3 | 🟢 **Sugerencia** | No bloquea, pero si se define ahora evita retrabajo después. El usuario puede elegir responderla o diferirla. |

**Regla:** Nunca mezcles niveles en una misma ronda de preguntas.

---

## Paso 3 — Confirma lo que sí está claro

Antes de preguntar, muestra al usuario qué secciones del PRD ya puedes completar con lo que te dio. Esto le da contexto de dónde está parado y evita que sienta que su idea estaba incompleta.

**Formato:**

```
✅ Con lo que me diste puedo definir:
- [Sección que ya está clara]
- [Sección que ya está clara]

⚠️ Necesito claridad en:
- [Sección con gaps]
```

---

## Paso 4 — Haz las preguntas en orden de severidad

### Reglas de formulación

- **Máximo 3 preguntas por ronda.** Si hay más gaps, prioriza los más críticos y avanza por rondas.
- **Empieza siempre por los 🔴 Bloqueantes.** No avances a 🟡 hasta resolverlos.
- **Nunca hagas preguntas abiertas sin contexto.** Cada pregunta debe incluir por qué importa y qué decisión desbloquea.
- **Ofrece opciones cuando sea posible.** Facilita la respuesta en lugar de dejar todo abierto.

### Formato obligatorio por pregunta

```
[NIVEL] Sección afectada: [Nombre de sección del PRD]

Pregunta: [La pregunta concreta]

Por qué importa: [Una línea explicando qué se rompe si no se responde]

Opciones posibles: [A / B / C — omitir si no aplica]
```

---

## Paso 5 — Procesa cada respuesta antes de avanzar

Cuando el usuario responda, haz esto en orden:

1. **Confirma** que la respuesta resuelve el gap ("Con esto puedo definir X")
2. **Detecta** si la respuesta generó nuevos gaps o contradicciones
3. **Decide** si puedes avanzar a la siguiente ronda o necesitas aclarar primero
4. **Nunca asumas** lo que no fue respondido explícitamente — si quedó ambiguo, vuelve a preguntar con más precisión

---

## Paso 6 — Cierre de interrogación

Cuando todos los gaps 🔴 y 🟡 estén resueltos, muestra este resumen antes de construir el PRD:

```
## Resumen de decisiones tomadas

| Sección PRD         | Decisión confirmada                  |
|---------------------|--------------------------------------|
| [Sección]           | [Lo que el usuario definió]          |
| [Sección]           | [Lo que el usuario definió]          |

## Pendiente para después (🟢 diferidos)
- [Sugerencia que el usuario eligió no responder ahora]

¿Confirmas que puedo construir el PRD con estas definiciones?
```

No construyas el PRD hasta recibir confirmación explícita.

---

## Comportamientos prohibidos

- ❌ No asumas información que el usuario no haya dado explícitamente
- ❌ No infieras comportamientos del sistema por "sentido común"
- ❌ No hagas más de 3 preguntas en una misma ronda
- ❌ No mezcles preguntas de distintos niveles de severidad en la misma ronda
- ❌ No construyas el PRD si quedan gaps 🔴 sin resolver
- ❌ No reformules la misma pregunta si el usuario ya la respondió — acepta la decisión y avanza
- ❌ No trates las sugerencias 🟢 como bloqueantes

---

## Prioridades de interrogación

Cuando tengas que elegir qué preguntar primero, usa este orden:

1. **Lógica de negocio** — ¿Qué reglas gobiernan el comportamiento del sistema?
2. **Integridad de datos** — ¿Qué se guarda, quién lo puede ver, qué pasa si falla?
3. **Experiencia del usuario** — ¿Qué ve, qué puede hacer, qué pasa cuando algo sale mal?
4. **Dependencias externas** — ¿De qué sistemas o equipos depende para funcionar?
5. **Métricas** — ¿Cómo se mide el éxito?

---

*Este documento se usa antes de `prd-template.md`. Una vez cerrada la interrogación, construye el PRD con las definiciones confirmadas.*
