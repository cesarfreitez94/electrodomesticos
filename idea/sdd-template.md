# SDD: [Nombre del Sistema o Feature]

> **Instrucciones para el LLM:**
> Este documento es un Software Design Document (SDD). Se construye a partir de un PRD aprobado
> y su único consumidor es el agente de tasks, que lo usará para generar trabajo técnico concreto.
>
> **Tu rol al leer este SDD:**
> - No interpretes ni infertas decisiones de diseño que no estén explícitas aquí
> - Cada componente, endpoint, modelo de datos y regla de negocio debe poder convertirse en 1 o más tasks atómicas
> - Si una sección está marcada como `[PENDIENTE]`, no generes tasks de esa sección hasta que esté completa
> - Agrupa las tasks por funcionalidad, no por tipo técnico (no agrupes "todos los endpoints juntos")
>
> **Flujo del pipeline:**
> `PRD (qué y por qué)` → `SDD (cómo)` → `Tasks (quién hace qué)` → `Desarrollo`
> Este documento vive entre el PRD y las tasks. No repite el problema ni el objetivo — solo define la solución técnica.

---

## Metadatos

| Campo            | Valor                          |
|------------------|--------------------------------|
| Versión          | 1.0                            |
| Fecha            | YYYY-MM-DD                     |
| Autor            | [Nombre]                       |
| Estado           | Draft / En revisión / Aprobado |
| PRD de referencia | [Nombre o link del PRD]       |
| Producto         | [Nombre del producto]          |

---

## 1. Contexto Técnico

> **Por qué este documento existe y sobre qué sistema opera.**
> No repitas el problema de negocio — eso está en el PRD. Aquí solo describe el entorno técnico en el que esta solución vive.

- **Sistema:** [Nombre del sistema o producto]
- **Tipo:** [Web app / API REST / Microservicio / CLI / Mixto]
- **Stack tecnológico:** [Lenguajes, frameworks, plataforma — ej: Node.js + React + PostgreSQL + AWS]
- **Entorno de despliegue:** [Cloud / on-premise / serverless / contenedores]
- **PRD que origina este SDD:** [Referencia directa — nombre y versión]

---

## 2. Arquitectura de la Solución

> **Vista de alto nivel de cómo está organizada la solución.**
> No necesita ser un diagrama detallado — basta con describir las capas, componentes principales y cómo se conectan.
> Si el sistema es simple, una descripción en texto es suficiente.

### Componentes principales

| Componente       | Responsabilidad                          | Tecnología        |
|------------------|------------------------------------------|-------------------|
| [Componente 1]   | [Qué hace — ej: Manejo de autenticación] | [Ej: Node.js]     |
| [Componente 2]   | [Qué hace]                               | [Tecnología]      |
| [Componente 3]   | [Qué hace]                               | [Tecnología]      |

### Diagrama de interacción *(opcional pero recomendado)*

```
[Cliente] → [API Gateway] → [Servicio A] → [Base de datos]
                          ↘ [Servicio B] → [Servicio externo]
```

> Usa texto plano o pseudocódigo. No es necesario UML.

---

## 3. Modelo de Datos

> **Qué datos maneja el sistema, cómo están estructurados y cómo se relacionan.**
> Solo incluir las entidades que esta iteración crea o modifica.

### Entidades

#### [Nombre de la entidad — ej: Usuario]

| Campo         | Tipo          | Restricciones                  | Descripción                        |
|---------------|---------------|--------------------------------|------------------------------------|
| id            | UUID          | PK, NOT NULL                   | Identificador único                |
| [campo]       | [tipo]        | [restricciones]                | [descripción]                      |
| created_at    | Timestamp     | NOT NULL, default: now()       | Fecha de creación                  |

#### [Entidad 2]

| Campo    | Tipo   | Restricciones | Descripción |
|----------|--------|---------------|-------------|
| id       | UUID   | PK, NOT NULL  | ...         |
| [campo]  | [tipo] | [restricciones] | [descripción] |

### Relaciones

- [Entidad A] tiene muchos [Entidad B] — relación `1:N`
- [Entidad B] pertenece a [Entidad A] a través de `[campo FK]`

---

## 4. Interfaces del Sistema

> **Cómo el sistema expone y consume información.**
> Incluye endpoints, eventos, o cualquier contrato de interfaz que el agente de tasks necesita implementar.

### 4.1 Endpoints / API

> Formato: `MÉTODO /ruta` — descripción breve

#### [Funcionalidad — ej: Autenticación]

| Método | Ruta              | Descripción                        | Auth requerida |
|--------|-------------------|------------------------------------|----------------|
| POST   | /api/v1/[ruta]    | [Qué hace]                         | No             |
| GET    | /api/v1/[ruta]    | [Qué hace]                         | Sí             |
| PUT    | /api/v1/[ruta]/:id | [Qué hace]                        | Sí             |

**Request body — POST /api/v1/[ruta]:**
```json
{
  "campo": "tipo — descripción"
}
```

**Response exitosa (200/201):**
```json
{
  "campo": "tipo — descripción"
}
```

**Errores esperados:**
| Código | Causa                          |
|--------|--------------------------------|
| 400    | [Descripción del error]        |
| 401    | No autenticado                 |
| 404    | Recurso no encontrado          |

#### [Funcionalidad 2]

*(repetir estructura)*

---

### 4.2 Eventos / Mensajería *(si aplica)*

| Evento            | Productor     | Consumidor    | Payload clave             |
|-------------------|---------------|---------------|---------------------------|
| [nombre.evento]   | [Componente]  | [Componente]  | [Campos relevantes]       |

---

### 4.3 Integraciones externas *(si aplica)*

| Servicio externo  | Tipo          | Qué se consume / envía            | Manejo de fallo           |
|-------------------|---------------|-----------------------------------|---------------------------|
| [Nombre]          | REST / SDK / Webhook | [Descripción]              | [Retry / fallback / error] |

---

## 5. Lógica de Negocio y Reglas Críticas

> **Las decisiones que el sistema toma y que no son obvias desde el modelo de datos o los endpoints.**
> Si una regla no está aquí, el agente de tasks no puede implementarla correctamente.

- **RN-01:** [Regla de negocio — ej: Un usuario solo puede tener un rol activo a la vez]
- **RN-02:** [Condición — ej: Si el pago falla, el estado de la orden debe cambiar a "pendiente" y notificar al usuario]
- **RN-03:** [Validación — ej: El email debe ser único en el sistema antes de crear la cuenta]
- **RN-04:** [...]

> Referencia cruzada con RF del PRD cuando aplique: `(ver RF-01)`

---

## 6. Manejo de Errores y Estados Alternos

> **Qué hace el sistema cuando algo falla. Debe cubrir los estados de error declarados en los flujos del PRD.**

| Escenario de error                  | Comportamiento esperado del sistema              | Código / Mensaje al usuario         |
|-------------------------------------|--------------------------------------------------|-------------------------------------|
| [Ej: Timeout de servicio externo]   | Reintentar 3 veces, luego retornar error 503     | "Servicio no disponible"            |
| [Ej: Datos inválidos en request]    | Retornar 400 con detalle del campo fallido       | "El campo X es requerido"           |
| [Ej: Usuario no autenticado]        | Retornar 401 y redirigir al login                | "Sesión expirada"                   |
| [Escenario N]                       | [Comportamiento]                                 | [Mensaje]                           |

---

## 7. Seguridad y Acceso

> **Solo los controles que aplican a esta iteración. No incluir lo que no se implementará ahora.**

- **Autenticación:** [Ej: JWT con expiración de 24h / OAuth2 / Session cookie]
- **Autorización:** [Ej: RBAC con roles: admin, usuario, invitado]
- **Datos sensibles:** [Ej: Passwords hasheados con bcrypt, PII encriptado en reposo]
- **Rate limiting:** [Ej: 100 requests/min por IP en endpoints públicos] *(si aplica)*
- **CORS:** [Ej: Solo orígenes listados en variable de entorno] *(si aplica)*

---

## 8. Requisitos No Funcionales Técnicos

> **Traducción técnica de los RNF del PRD. Solo los que impactan decisiones de diseño en esta iteración.**

| Requisito         | Especificación técnica                            | Cómo se implementa               |
|-------------------|---------------------------------------------------|----------------------------------|
| Performance       | [Ej: P95 < 300ms en endpoints críticos]           | [Ej: Caché Redis en capa X]      |
| Disponibilidad    | [Ej: 99.5% uptime]                                | [Ej: Health checks + auto-restart] |
| Escalabilidad     | [Ej: Horizontal scaling hasta N instancias]       | [Ej: Stateless + load balancer]  |
| Observabilidad    | [Ej: Logs estructurados + trazas distribuidas]    | [Ej: OpenTelemetry + Datadog]    |

---

## 9. Dependencias Técnicas

> **Todo lo que debe estar disponible o resuelto para que este SDD pueda implementarse.**
> Trazabilidad directa con la sección de Dependencias Externas del PRD.

| Dependencia              | Tipo                    | Estado            | Responsable       | Impacto si no está |
|--------------------------|-------------------------|-------------------|-------------------|--------------------|
| [Ej: Auth service]       | Servicio interno        | Disponible / Pendiente | [Equipo]    | Bloquea RF-01, RF-03 |
| [Ej: Stripe API]         | API externa             | Disponible        | [Nombre]          | Bloquea flujo de pago |
| [Ej: Base de datos prod] | Infraestructura         | Pendiente         | [DevOps]          | Bloquea despliegue |

---

## 10. Guía de Generación de Tasks

> **Instrucciones directas para el agente que genera tasks a partir de este SDD.**

### Criterios de agrupación
- Agrupa tasks por **funcionalidad de negocio**, no por tipo técnico
- Ejemplo correcto: `[Auth] Implementar registro de usuario` (agrupa backend + validaciones)
- Ejemplo incorrecto: `[Backend] Todos los endpoints` (mezcla funcionalidades)

### Granularidad esperada
- Una task = una unidad de trabajo que un desarrollador puede completar en **menos de 1 día**
- Si una task es más grande, subdivídela
- Si una task es trivial (< 30 min), agrúpala con otra relacionada

### Formato de task esperado
```
[Funcionalidad] Título descriptivo en verbo infinitivo

Contexto: [Por qué existe esta task — referencia a RN o RF del PRD/SDD]
Criterio de aceptación: [Condición testeable que confirma que está hecha]
Dependencias: [Tasks que deben completarse antes]
Estimación sugerida: [XS / S / M / L]
```

### Orden de generación
1. Tasks de infraestructura y setup *(si aplica)*
2. Tasks de modelo de datos y migraciones
3. Tasks de lógica de negocio y reglas críticas
4. Tasks de interfaces (endpoints / UI)
5. Tasks de manejo de errores
6. Tasks de seguridad
7. Tasks de tests

### Lo que NO debe convertirse en task todavía
- Secciones marcadas como `[PENDIENTE]`
- Decisiones de diseño no confirmadas
- Funcionalidades en el Out of Scope del PRD

---

## Checklist de completitud

> **Antes de pasar este SDD al agente de tasks, verifica:**

- [ ] Cada RF del PRD tiene al menos un componente, endpoint o regla de negocio que lo implementa
- [ ] Cada flujo del PRD tiene su manejo de error correspondiente en la sección 6
- [ ] Cada dependencia externa del PRD aparece en la sección 9 con estado claro
- [ ] No hay decisiones de diseño implícitas — todo está escrito explícitamente
- [ ] La sección 10 tiene suficiente contexto para que el agente de tasks no necesite leer el PRD

---

*Fin del SDD. El siguiente paso es la generación de tasks por el agente correspondiente.*
