# SDD: Plataforma Web de Servicios de Mantenimiento de Electrodomésticos

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

| Campo             | Valor                                          |
|-------------------|------------------------------------------------|
| Versión           | 1.0                                            |
| Fecha             | 2026-04-25                                     |
| Autor             | [PENDIENTE]                                    |
| Estado            | Draft                                          |
| PRD de referencia | PRD v1.0 — Plataforma Web Electrodomésticos    |
| Producto          | Plataforma Web Electrodomésticos               |

---

## 1. Contexto Técnico

- **Sistema:** Plataforma web de agendamiento y gestión de servicios de mantenimiento de electrodomésticos
- **Tipo:** Web app full-stack (sitio público + backoffice + portal técnico en un mismo proyecto)
- **Stack tecnológico:**
  - Runtime: Node.js
  - Framework: Next.js 14+ con App Router
  - Lenguaje: TypeScript
  - Base de datos: PostgreSQL (instalado en el VPS)
  - ORM: Prisma
  - UI: shadcn/ui + Tailwind CSS
  - Autenticación: Auth.js v5 (NextAuth) con Credentials provider
  - Estado global: Zustand
  - Data fetching: TanStack Query (React Query)
  - Formularios: React Hook Form + Zod
  - Email: Resend + React Email
  - Cron jobs: node-cron (integrado en el proceso Next.js)
  - Calendario: FullCalendar (React)
- **Entorno de despliegue:**
  - Desarrollo: Sin reverse proxy, Next.js directo en `localhost:3000`
  - Producción: VPS propio (DigitalOcean / Linode), PM2 como process manager, Nginx como reverse proxy con SSL via Certbot (Let's Encrypt)
  - Base de datos: PostgreSQL instalado en el mismo VPS
  - Secretos: archivo `.env` en el VPS, fuera del repositorio git
  - Backups: `pg_dump` diario automatizado con cron del sistema operativo
- **PRD que origina este SDD:** PRD v1.0 — Plataforma Web Electrodomésticos

---

## 2. Arquitectura de la Solución

### Componentes principales

| Componente              | Responsabilidad                                                                 | Tecnología                    |
|-------------------------|---------------------------------------------------------------------------------|-------------------------------|
| Sitio público           | Catálogo de servicios, reels de YouTube, formulario de agendamiento, chat flotante, redes sociales | Next.js App Router `/(public)` |
| Backoffice (admin)      | Gestión de citas, técnicos, servicios, repuestos, calendario, dashboard, notificaciones | Next.js App Router `/(admin)` |
| Portal técnico          | Vista de citas asignadas y confirmación de comprensión por el técnico           | Next.js App Router `/(tecnico)` |
| API Routes              | Lógica de negocio, acceso a BD, envío de emails, validación server-side          | Next.js API Routes (`/app/api`) |
| Base de datos           | Persistencia de todas las entidades del sistema                                 | PostgreSQL + Prisma            |
| Scheduler               | Envío de recordatorios de visita según periodicidad configurada                 | node-cron (en proceso Next.js) |
| Servicio de email       | Envío transaccional de confirmaciones, notificaciones y recordatorios           | Resend + React Email           |
| Reverse proxy (prod)    | Terminación SSL, proxy hacia el proceso Next.js                                 | Nginx + Certbot                |
| Process manager (prod)  | Mantener el proceso Next.js activo y reiniciarlo ante fallos                    | PM2                            |

### Diagrama de interacción

```
[Navegador del cliente]
        │
        ▼
[Nginx (prod) / localhost:3000 (dev)]
        │
        ▼
[Next.js App Router]
   ├── /(public)        → Sitio público (SSR + Server Components)
   ├── /(admin)         → Backoffice (rutas protegidas por rol: admin)
   ├── /(tecnico)       → Portal técnico (rutas protegidas por rol: tecnico)
   └── /api/*           → API Routes (REST, validación Zod, lógica de negocio)
                │
                ▼
         [Prisma Client]
                │
                ▼
         [PostgreSQL]

[node-cron] ──► [API interna / Prisma] ──► [Resend] ──► [Correo al usuario]
[Resend]    ◄── [API Routes]           ◄── Eventos de agendamiento / cambios de estado
```

---

## 3. Modelo de Datos

### Entidades

#### Usuario (users)

| Campo          | Tipo        | Restricciones                    | Descripción                                    |
|----------------|-------------|----------------------------------|------------------------------------------------|
| id             | UUID        | PK, NOT NULL                     | Identificador único                            |
| nombre         | VARCHAR(100)| NOT NULL                         | Nombre completo del usuario                    |
| email          | VARCHAR(255)| UNIQUE, NOT NULL                 | Correo electrónico (usado para login)          |
| password_hash  | TEXT        | NOT NULL                         | Contraseña hasheada con bcrypt                 |
| rol            | ENUM        | NOT NULL — valores: `admin`, `tecnico` | Rol del usuario en el sistema            |
| activo         | BOOLEAN     | NOT NULL, default: true          | Si el usuario puede acceder al sistema         |
| created_at     | TIMESTAMP   | NOT NULL, default: now()         | Fecha de creación                              |
| updated_at     | TIMESTAMP   | NOT NULL, default: now()         | Fecha de última modificación                   |

> Nota: Los clientes NO tienen cuenta en el sistema. Solo se almacenan sus datos como parte de la cita.

---

#### Region (regiones)

| Campo      | Tipo         | Restricciones        | Descripción                     |
|------------|--------------|----------------------|---------------------------------|
| id         | UUID         | PK, NOT NULL         | Identificador único             |
| nombre     | VARCHAR(100) | NOT NULL             | Nombre de la región (ej: Metropolitana) |
| created_at | TIMESTAMP    | NOT NULL, default: now() | Fecha de creación           |

---

#### Ciudad (ciudades)

| Campo      | Tipo         | Restricciones             | Descripción                            |
|------------|--------------|---------------------------|----------------------------------------|
| id         | UUID         | PK, NOT NULL              | Identificador único                    |
| nombre     | VARCHAR(100) | NOT NULL                  | Nombre de la ciudad                    |
| region_id  | UUID         | FK → regiones.id, NOT NULL | Región a la que pertenece             |
| habilitada | BOOLEAN      | NOT NULL, default: true   | Si acepta nuevos agendamientos         |
| suspendida | BOOLEAN      | NOT NULL, default: false  | Suspensión temporal por falta de técnicos |
| created_at | TIMESTAMP    | NOT NULL, default: now()  | Fecha de creación                      |

---

#### TecnicoCiudad (tecnicos_ciudades) — tabla de relación N:N

| Campo      | Tipo      | Restricciones                        | Descripción                     |
|------------|-----------|--------------------------------------|---------------------------------|
| tecnico_id | UUID      | FK → users.id (rol=tecnico), NOT NULL | Técnico                        |
| ciudad_id  | UUID      | FK → ciudades.id, NOT NULL           | Ciudad asignada al técnico      |
| PK         | —         | (tecnico_id, ciudad_id)              | Clave primaria compuesta        |

---

#### Categoria (categorias)

| Campo      | Tipo         | Restricciones        | Descripción                     |
|------------|--------------|----------------------|---------------------------------|
| id         | UUID         | PK, NOT NULL         | Identificador único             |
| nombre     | VARCHAR(100) | NOT NULL             | Nombre de la categoría          |
| created_at | TIMESTAMP    | NOT NULL, default: now() | Fecha de creación           |

---

#### Servicio (servicios)

| Campo               | Tipo         | Restricciones              | Descripción                           |
|---------------------|--------------|----------------------------|---------------------------------------|
| id                  | UUID         | PK, NOT NULL               | Identificador único                   |
| nombre              | VARCHAR(150) | NOT NULL                   | Nombre del servicio                   |
| categoria_id        | UUID         | FK → categorias.id, NOT NULL | Categoría del servicio              |
| descripcion         | TEXT         | NOT NULL                   | Descripción completa                  |
| precio_mantenimiento| DECIMAL(10,2)| NOT NULL                   | Precio base del servicio              |
| activo              | BOOLEAN      | NOT NULL, default: true    | Si se muestra en el catálogo público  |
| created_at          | TIMESTAMP    | NOT NULL, default: now()   | Fecha de creación                     |
| updated_at          | TIMESTAMP    | NOT NULL, default: now()   | Fecha de última modificación          |

---

#### SubProducto (sub_productos)

| Campo      | Tipo         | Restricciones              | Descripción                                    |
|------------|--------------|----------------------------|------------------------------------------------|
| id         | UUID         | PK, NOT NULL               | Identificador único                            |
| servicio_id| UUID         | FK → servicios.id, NOT NULL | Servicio al que pertenece                     |
| nombre     | VARCHAR(150) | NOT NULL                   | Nombre del sub-producto                        |
| precio     | DECIMAL(10,2)| NOT NULL                   | Precio propio del sub-producto                 |
| activo     | BOOLEAN      | NOT NULL, default: true    | Si está disponible                             |
| created_at | TIMESTAMP    | NOT NULL, default: now()   | Fecha de creación                              |
| updated_at | TIMESTAMP    | NOT NULL, default: now()   | Fecha de última modificación                   |

---

#### AtributoSubProducto (atributos_sub_producto)

| Campo           | Tipo         | Restricciones                              | Descripción                                          |
|-----------------|--------------|--------------------------------------------|------------------------------------------------------|
| id              | UUID         | PK, NOT NULL                               | Identificador único                                  |
| sub_producto_id | UUID         | FK → sub_productos.id, NOT NULL            | Sub-producto al que pertenece                        |
| nombre          | VARCHAR(100) | NOT NULL                                   | Nombre del atributo (ej: "Voltaje")                  |
| tipo            | ENUM         | NOT NULL — valores: `texto`, `numero`, `seleccion` | Tipo de valor del atributo               |
| opciones        | JSONB        | nullable                                   | Opciones disponibles si tipo = `seleccion` (array de strings) |
| created_at      | TIMESTAMP    | NOT NULL, default: now()                   | Fecha de creación                                    |

---

#### Repuesto (repuestos)

| Campo        | Tipo         | Restricciones              | Descripción                            |
|--------------|--------------|----------------------------|----------------------------------------|
| id           | UUID         | PK, NOT NULL               | Identificador único                    |
| nombre       | VARCHAR(150) | NOT NULL                   | Nombre del repuesto                    |
| descripcion  | TEXT         | nullable                   | Descripción del repuesto               |
| categoria_id | UUID         | FK → categorias.id, NOT NULL | Categoría de servicio relacionada    |
| disponible   | BOOLEAN      | NOT NULL, default: true    | Si está disponible para solicitar      |
| created_at   | TIMESTAMP    | NOT NULL, default: now()   | Fecha de creación                      |
| updated_at   | TIMESTAMP    | NOT NULL, default: now()   | Fecha de última modificación           |

---

#### DisponibilidadCalendario (disponibilidad_calendario)

| Campo        | Tipo      | Restricciones        | Descripción                                             |
|--------------|-----------|----------------------|---------------------------------------------------------|
| id           | UUID      | PK, NOT NULL         | Identificador único                                     |
| dia_semana   | INTEGER   | NOT NULL — 0=Lunes, 6=Domingo | Día de la semana al que aplica              |
| hora_inicio  | TIME      | NOT NULL             | Inicio de la franja horaria habilitada                  |
| hora_fin     | TIME      | NOT NULL             | Fin de la franja horaria habilitada                     |
| activo       | BOOLEAN   | NOT NULL, default: true | Si la franja está habilitada                         |
| created_at   | TIMESTAMP | NOT NULL, default: now() | Fecha de creación                                   |
| updated_at   | TIMESTAMP | NOT NULL, default: now() | Fecha de última modificación                        |

> Nota: La replicación al resto del mes es una operación de lectura/cálculo, no almacena datos por fecha individual. El sistema calcula disponibilidad dinámicamente combinando `DisponibilidadCalendario` con las `Cita` existentes.

---

#### Cita (citas)

| Campo              | Tipo         | Restricciones                           | Descripción                                               |
|--------------------|--------------|-----------------------------------------|-----------------------------------------------------------|
| id                 | UUID         | PK, NOT NULL                            | Identificador único                                       |
| servicio_id        | UUID         | FK → servicios.id, NOT NULL             | Servicio solicitado                                       |
| tecnico_id         | UUID         | FK → users.id (rol=tecnico), nullable   | Técnico asignado (null si estado=Emergencia sin resolver)  |
| ciudad_id          | UUID         | FK → ciudades.id, NOT NULL              | Ciudad de la visita                                       |
| cliente_nombre     | VARCHAR(100) | NOT NULL                                | Nombre del cliente                                        |
| cliente_email      | VARCHAR(255) | NOT NULL                                | Correo del cliente                                        |
| cliente_telefono   | VARCHAR(20)  | NOT NULL                                | Teléfono del cliente                                      |
| cliente_direccion  | TEXT         | NOT NULL                                | Dirección de la visita                                    |
| fecha_hora         | TIMESTAMP    | NOT NULL                                | Fecha y hora de la visita agendada                        |
| estado             | ENUM         | NOT NULL — valores: `pendiente`, `confirmado`, `en_curso`, `completado`, `cancelado`, `emergencia` | Estado actual de la cita |
| confirmado_tecnico | BOOLEAN      | NOT NULL, default: false                | Si el técnico confirmó comprensión de la cita             |
| notas_admin        | TEXT         | nullable                                | Notas internas del administrador                          |
| created_at         | TIMESTAMP    | NOT NULL, default: now()                | Fecha de creación del registro                            |
| updated_at         | TIMESTAMP    | NOT NULL, default: now()                | Fecha de última modificación                              |

---

#### CitaRepuesto (citas_repuestos) — repuestos solicitados en una cita

| Campo       | Tipo      | Restricciones                  | Descripción                     |
|-------------|-----------|--------------------------------|---------------------------------|
| cita_id     | UUID      | FK → citas.id, NOT NULL        | Cita asociada                   |
| repuesto_id | UUID      | FK → repuestos.id, NOT NULL    | Repuesto solicitado             |
| PK          | —         | (cita_id, repuesto_id)         | Clave primaria compuesta        |

---

#### ConfiguracionRecordatorio (configuracion_recordatorios)

| Campo              | Tipo      | Restricciones             | Descripción                                        |
|--------------------|-----------|---------------------------|----------------------------------------------------|
| id                 | UUID      | PK, NOT NULL              | Identificador único                                |
| horas_antes        | INTEGER   | NOT NULL                  | Horas antes de la visita para enviar el recordatorio |
| activo             | BOOLEAN   | NOT NULL, default: true   | Si este recordatorio está habilitado               |
| created_at         | TIMESTAMP | NOT NULL, default: now()  | Fecha de creación                                  |

---

#### HistorialNotificacion (historial_notificaciones)

| Campo         | Tipo         | Restricciones                           | Descripción                                   |
|---------------|--------------|-----------------------------------------|-----------------------------------------------|
| id            | UUID         | PK, NOT NULL                            | Identificador único                           |
| cita_id       | UUID         | FK → citas.id, nullable                 | Cita relacionada (null si es notif general)   |
| tipo          | VARCHAR(50)  | NOT NULL                                | Tipo: `confirmacion_cliente`, `notif_tecnico`, `recordatorio`, `cancelacion`, `emergencia_admin` |
| destinatario  | VARCHAR(255) | NOT NULL                                | Email destinatario                            |
| estado        | ENUM         | NOT NULL — valores: `enviado`, `fallido` | Estado del envío                             |
| error_detalle | TEXT         | nullable                                | Detalle del error si estado=fallido           |
| enviado_at    | TIMESTAMP    | NOT NULL, default: now()                | Fecha/hora del intento de envío               |

---

#### ConfiguracionSistema (configuracion_sistema)

| Campo       | Tipo         | Restricciones        | Descripción                                              |
|-------------|--------------|----------------------|----------------------------------------------------------|
| id          | UUID         | PK, NOT NULL         | Identificador único                                      |
| clave       | VARCHAR(100) | UNIQUE, NOT NULL     | Clave de configuración (ej: `horario_atencion_inicio`)   |
| valor       | TEXT         | NOT NULL             | Valor de la configuración                                |
| descripcion | TEXT         | nullable             | Descripción de qué controla esta clave                   |
| updated_at  | TIMESTAMP    | NOT NULL, default: now() | Fecha de última modificación                         |

> Claves de configuración esperadas:
> - `horario_atencion_inicio` — Hora de inicio del horario de atención del chat flotante (ej: `09:00`)
> - `horario_atencion_fin` — Hora de fin del horario de atención (ej: `18:00`)
> - `horario_atencion_dias` — Días habilitados en formato JSON array (ej: `[1,2,3,4,5]` para lun-vie)

---

#### RedSocial (redes_sociales)

| Campo      | Tipo         | Restricciones        | Descripción                              |
|------------|--------------|----------------------|------------------------------------------|
| id         | UUID         | PK, NOT NULL         | Identificador único                      |
| nombre     | VARCHAR(50)  | NOT NULL             | Nombre de la red (ej: Instagram)         |
| url        | TEXT         | NOT NULL             | URL del perfil                           |
| icono      | VARCHAR(50)  | nullable             | Identificador del ícono (ej: nombre del componente de shadcn o clase) |
| orden      | INTEGER      | NOT NULL, default: 0 | Orden de visualización                   |
| activo     | BOOLEAN      | NOT NULL, default: true | Si se muestra en el sitio público     |
| created_at | TIMESTAMP    | NOT NULL, default: now() | Fecha de creación                    |

---

### Relaciones

- `regiones` tiene muchas `ciudades` — relación `1:N`
- `ciudades` tiene muchos `tecnicos` a través de `tecnicos_ciudades` — relación `N:N`
- `users` (rol=tecnico) tiene muchas `ciudades` a través de `tecnicos_ciudades` — relación `N:N`
- `categorias` tiene muchos `servicios` — relación `1:N`
- `categorias` tiene muchos `repuestos` — relación `1:N`
- `servicios` tiene muchos `sub_productos` — relación `1:N`
- `sub_productos` tiene muchos `atributos_sub_producto` — relación `1:N`
- `citas` tiene muchos `repuestos` a través de `citas_repuestos` — relación `N:N`
- `citas` pertenece a un `servicio` — relación `N:1`
- `citas` pertenece a una `ciudad` — relación `N:1`
- `citas` pertenece a un `tecnico` (usuario) — relación `N:1`, nullable
- `historial_notificaciones` pertenece a una `cita` — relación `N:1`, nullable

---

## 4. Interfaces del Sistema

### 4.1 Endpoints / API

> Prefijo base: `/api/v1`
> Autenticación: Auth.js v5 con session token en cookie httpOnly
> Autorización: middleware de Next.js verifica rol según la ruta

---

#### Autenticación

| Método | Ruta                        | Descripción                                  | Auth requerida |
|--------|-----------------------------|----------------------------------------------|----------------|
| POST   | `/api/auth/signin`          | Login con email y contraseña (Auth.js)        | No             |
| POST   | `/api/auth/signout`         | Cierre de sesión (Auth.js)                    | Sí             |
| GET    | `/api/auth/session`         | Obtener sesión activa del usuario             | No             |

> Auth.js v5 gestiona estos endpoints internamente. No se implementan manualmente.

---

#### Agendamiento (público — sin autenticación)

| Método | Ruta                              | Descripción                                               | Auth requerida |
|--------|-----------------------------------|-----------------------------------------------------------|----------------|
| GET    | `/api/v1/public/servicios`        | Listar servicios activos con categoría, nombre y precio   | No             |
| GET    | `/api/v1/public/servicios/:id`    | Detalle completo de un servicio (incluye sub-productos)   | No             |
| GET    | `/api/v1/public/repuestos`        | Listar repuestos disponibles agrupados por categoría      | No             |
| GET    | `/api/v1/public/ciudades`         | Listar ciudades habilitadas y no suspendidas              | No             |
| GET    | `/api/v1/public/disponibilidad`   | Horarios disponibles para ciudad y fecha dada             | No             |
| POST   | `/api/v1/public/citas`            | Crear nueva cita (agendamiento del cliente)               | No             |

**Request body — POST `/api/v1/public/citas`:**
```json
{
  "servicio_id": "uuid",
  "repuesto_ids": ["uuid", "uuid"],
  "cliente_nombre": "string — requerido, 2-100 chars, sin HTML",
  "cliente_email": "string — requerido, formato email válido",
  "cliente_telefono": "string — requerido, 7-20 chars, solo dígitos y +-()",
  "cliente_direccion": "string — requerido, 5-255 chars, sin HTML",
  "ciudad_id": "uuid — requerido, debe existir y estar habilitada",
  "fecha_hora": "ISO 8601 datetime — requerido, debe ser fecha futura"
}
```

**Response exitosa (201):**
```json
{
  "cita_id": "uuid",
  "estado": "confirmado | emergencia",
  "mensaje": "string — descripción del estado para mostrar al usuario"
}
```

**Errores esperados:**
| Código | Causa |
|--------|-------|
| 400    | Datos inválidos o campos faltantes (detalle por campo) |
| 422    | Ciudad no habilitada o suspendida |
| 422    | Horario no disponible (ya ocupado o fuera del calendario) |
| 500    | Error interno al guardar o notificar |

**GET `/api/v1/public/disponibilidad`:**
```
Query params: ciudad_id (uuid), fecha (YYYY-MM-DD)
Response: { "slots": ["09:00", "10:00", "11:00", ...] }
```

---

#### Citas — Backoffice (admin)

| Método | Ruta                                | Descripción                                                | Auth requerida |
|--------|-------------------------------------|------------------------------------------------------------|----------------|
| GET    | `/api/v1/admin/citas`               | Listar citas con filtros: fecha, técnico, estado, ciudad    | admin          |
| GET    | `/api/v1/admin/citas/:id`           | Detalle completo de una cita                               | admin          |
| PATCH  | `/api/v1/admin/citas/:id/estado`    | Cambiar estado de la cita (confirmar, cancelar, etc.)      | admin          |
| PATCH  | `/api/v1/admin/citas/:id/tecnico`   | Asignar o reasignar técnico a una cita                     | admin          |

**Request body — PATCH `/api/v1/admin/citas/:id/estado`:**
```json
{
  "estado": "confirmado | en_curso | completado | cancelado"
}
```

**Request body — PATCH `/api/v1/admin/citas/:id/tecnico`:**
```json
{
  "tecnico_id": "uuid"
}
```

---

#### Técnicos — Backoffice (admin)

| Método | Ruta                                    | Descripción                                   | Auth requerida |
|--------|-----------------------------------------|-----------------------------------------------|----------------|
| GET    | `/api/v1/admin/tecnicos`                | Listar todos los técnicos con ciudades         | admin          |
| POST   | `/api/v1/admin/tecnicos`                | Crear técnico (crea usuario con rol=tecnico)   | admin          |
| GET    | `/api/v1/admin/tecnicos/:id`            | Detalle de un técnico                          | admin          |
| PUT    | `/api/v1/admin/tecnicos/:id`            | Actualizar datos del técnico                   | admin          |
| DELETE | `/api/v1/admin/tecnicos/:id`            | Desactivar técnico (soft delete — activo=false)| admin          |
| PUT    | `/api/v1/admin/tecnicos/:id/ciudades`   | Actualizar ciudades asignadas al técnico (N:N) | admin          |

**Request body — POST `/api/v1/admin/tecnicos`:**
```json
{
  "nombre": "string — requerido",
  "email": "string — requerido, único en el sistema",
  "password": "string — requerido, mín 8 chars",
  "ciudad_ids": ["uuid", "uuid"]
}
```

---

#### Servicios — Backoffice (admin)

| Método | Ruta                                        | Descripción                             | Auth requerida |
|--------|---------------------------------------------|-----------------------------------------|----------------|
| GET    | `/api/v1/admin/servicios`                   | Listar servicios con categoría          | admin          |
| POST   | `/api/v1/admin/servicios`                   | Crear servicio                          | admin          |
| GET    | `/api/v1/admin/servicios/:id`               | Detalle de servicio con sub-productos   | admin          |
| PUT    | `/api/v1/admin/servicios/:id`               | Actualizar servicio                     | admin          |
| DELETE | `/api/v1/admin/servicios/:id`               | Desactivar servicio (activo=false)      | admin          |
| POST   | `/api/v1/admin/servicios/:id/sub-productos` | Crear sub-producto                      | admin          |
| PUT    | `/api/v1/admin/sub-productos/:id`           | Actualizar sub-producto                 | admin          |
| DELETE | `/api/v1/admin/sub-productos/:id`           | Eliminar sub-producto                   | admin          |
| PATCH  | `/api/v1/admin/sub-productos/precio-masivo` | Actualizar precio de múltiples sub-productos | admin     |

**Request body — PATCH `/api/v1/admin/sub-productos/precio-masivo`:**
```json
{
  "sub_producto_ids": ["uuid", "uuid"],
  "precio": 9999.99
}
```

---

#### Repuestos — Backoffice (admin)

| Método | Ruta                          | Descripción                      | Auth requerida |
|--------|-------------------------------|----------------------------------|----------------|
| GET    | `/api/v1/admin/repuestos`     | Listar repuestos                 | admin          |
| POST   | `/api/v1/admin/repuestos`     | Crear repuesto                   | admin          |
| PUT    | `/api/v1/admin/repuestos/:id` | Actualizar repuesto              | admin          |
| DELETE | `/api/v1/admin/repuestos/:id` | Eliminar repuesto (soft delete)  | admin          |

---

#### Categorías — Backoffice (admin)

| Método | Ruta                           | Descripción           | Auth requerida |
|--------|--------------------------------|-----------------------|----------------|
| GET    | `/api/v1/admin/categorias`     | Listar categorías     | admin          |
| POST   | `/api/v1/admin/categorias`     | Crear categoría       | admin          |
| PUT    | `/api/v1/admin/categorias/:id` | Actualizar categoría  | admin          |
| DELETE | `/api/v1/admin/categorias/:id` | Eliminar categoría    | admin          |

---

#### Regiones y Ciudades — Backoffice (admin)

| Método | Ruta                                       | Descripción                              | Auth requerida |
|--------|--------------------------------------------|------------------------------------------|----------------|
| GET    | `/api/v1/admin/regiones`                   | Listar regiones con ciudades             | admin          |
| POST   | `/api/v1/admin/regiones`                   | Crear región                             | admin          |
| GET    | `/api/v1/admin/ciudades`                   | Listar todas las ciudades                | admin          |
| POST   | `/api/v1/admin/ciudades`                   | Crear ciudad                             | admin          |
| PATCH  | `/api/v1/admin/ciudades/:id/habilitada`    | Habilitar o deshabilitar ciudad          | admin          |
| PATCH  | `/api/v1/admin/ciudades/:id/suspendida`    | Suspender o reactivar ciudad temporalmente | admin        |

---

#### Calendario de disponibilidad — Backoffice (admin)

| Método | Ruta                                       | Descripción                                            | Auth requerida |
|--------|--------------------------------------------|--------------------------------------------------------|----------------|
| GET    | `/api/v1/admin/disponibilidad`             | Listar configuración de disponibilidad por día semana  | admin          |
| PUT    | `/api/v1/admin/disponibilidad`             | Guardar configuración de disponibilidad (reemplaza)    | admin          |

**Request body — PUT `/api/v1/admin/disponibilidad`:**
```json
{
  "franjas": [
    { "dia_semana": 0, "hora_inicio": "09:00", "hora_fin": "13:00", "activo": true },
    { "dia_semana": 0, "hora_inicio": "14:00", "hora_fin": "18:00", "activo": true }
  ]
}
```

---

#### Dashboard — Backoffice (admin)

| Método | Ruta                               | Descripción                                               | Auth requerida |
|--------|------------------------------------|-----------------------------------------------------------|----------------|
| GET    | `/api/v1/admin/dashboard`          | Métricas: citas hoy/semana, ingresos, ocupación, top servicios, tasa cancelación | admin |

**Response — GET `/api/v1/admin/dashboard`:**
```json
{
  "citas_hoy": 5,
  "citas_semana": 18,
  "ingresos_periodo": 250000,
  "tasa_ocupacion": 0.72,
  "tasa_cancelacion": 0.08,
  "servicios_top": [
    { "nombre": "Lavadora", "total": 12 }
  ],
  "emergencias_activas": 2
}
```

---

#### Notificaciones — Backoffice (admin)

| Método | Ruta                                      | Descripción                                     | Auth requerida |
|--------|-------------------------------------------|-------------------------------------------------|----------------|
| GET    | `/api/v1/admin/notificaciones`            | Listar historial de notificaciones              | admin          |
| GET    | `/api/v1/admin/notificaciones/fallidas`   | Listar solo notificaciones fallidas             | admin          |

---

#### Configuración — Backoffice (admin)

| Método | Ruta                                      | Descripción                                        | Auth requerida |
|--------|-------------------------------------------|----------------------------------------------------|----------------|
| GET    | `/api/v1/admin/configuracion`             | Obtener todas las claves de configuración del sistema | admin       |
| PUT    | `/api/v1/admin/configuracion`             | Actualizar claves de configuración                 | admin          |
| GET    | `/api/v1/admin/recordatorios`             | Listar configuraciones de recordatorio             | admin          |
| POST   | `/api/v1/admin/recordatorios`             | Crear configuración de recordatorio (ej: 24h antes)| admin          |
| DELETE | `/api/v1/admin/recordatorios/:id`         | Eliminar configuración de recordatorio             | admin          |

---

#### Redes Sociales — Backoffice (admin)

| Método | Ruta                                | Descripción                    | Auth requerida |
|--------|-------------------------------------|--------------------------------|----------------|
| GET    | `/api/v1/admin/redes-sociales`      | Listar redes sociales          | admin          |
| POST   | `/api/v1/admin/redes-sociales`      | Crear enlace de red social     | admin          |
| PUT    | `/api/v1/admin/redes-sociales/:id`  | Actualizar enlace              | admin          |
| DELETE | `/api/v1/admin/redes-sociales/:id`  | Eliminar enlace                | admin          |

---

#### Portal Técnico

| Método | Ruta                                       | Descripción                                          | Auth requerida |
|--------|--------------------------------------------|------------------------------------------------------|----------------|
| GET    | `/api/v1/tecnico/citas`                    | Listar citas asignadas al técnico autenticado        | tecnico        |
| GET    | `/api/v1/tecnico/citas/:id`                | Detalle de una cita asignada                         | tecnico        |
| PATCH  | `/api/v1/tecnico/citas/:id/confirmar`      | Registrar confirmación de comprensión de la cita     | tecnico        |

---

#### Endpoints públicos del sitio (datos para Server Components)

| Método | Ruta                                | Descripción                                      | Auth requerida |
|--------|-------------------------------------|--------------------------------------------------|----------------|
| GET    | `/api/v1/public/redes-sociales`     | Listar redes sociales activas para el sitio      | No             |
| GET    | `/api/v1/public/configuracion`      | Horario de atención del chat flotante            | No             |

---

### 4.2 Eventos / Mensajería

No aplica en v1. No hay sistema de mensajería asíncrona externa. Los eventos (agendamiento, cambio de estado) se procesan síncronamente en los API Routes y disparan el envío de emails directamente al momento de la operación.

---

### 4.3 Integraciones externas

| Servicio externo | Tipo    | Qué se consume / envía                                     | Manejo de fallo |
|------------------|---------|------------------------------------------------------------|-----------------|
| Resend           | REST API / SDK Node.js | Envío de emails transaccionales (confirmaciones, notificaciones, recordatorios, cancelaciones) | Si el envío falla: se registra el intento en `historial_notificaciones` con estado=`fallido` y detalle del error. No se reintenta automáticamente en v1 — el admin gestiona desde el backoffice |
| YouTube embed    | HTML embed (iframe) | Se embebe el iframe de YouTube por URL. No se consume API de YouTube | Si el video no carga: se muestra placeholder. No requiere API key |

---

## 5. Lógica de Negocio y Reglas Críticas

- **RN-01:** Al crear una cita, el sistema consulta los técnicos activos asignados a la `ciudad_id` seleccionada. Para cada técnico, cuenta sus citas en estado `confirmado` o `en_curso` en la misma `fecha_hora`. El técnico con menor cantidad de citas activas en ese slot es el asignado. Si hay empate, se elige por `created_at` más antiguo del usuario. `(ver RF-09)`

- **RN-02:** Si no existe ningún técnico activo asignado a la ciudad seleccionada, o todos tienen conflicto de horario en el slot elegido, la cita se crea en estado `emergencia` con `tecnico_id = null`. `(ver RF-10)`

- **RN-03:** Un slot de horario está disponible si existe una franja en `disponibilidad_calendario` para ese `dia_semana` con `activo=true`, y la `fecha_hora` solicitada cae dentro de esa franja. El cálculo de disponibilidad es dinámico: no se almacenan slots por fecha concreta. `(ver RF-08)`

- **RN-04:** El sistema no limita el número de citas por slot (multiple técnicos pueden atender en paralelo). La disponibilidad se calcula por técnico, no por slot global. Si hay al menos un técnico disponible, el slot aparece como disponible.

- **RN-05:** Si el admin deshabilita un horario que contiene citas en estado `confirmado` o `en_curso`, el sistema muestra una advertencia con la cantidad de citas afectadas antes de proceder. Si el admin confirma, las citas NO se cancelan automáticamente — quedan en su estado actual pero el horario queda cerrado para nuevas citas. `(ver RF-30)`

- **RN-06:** Al marcar una ciudad como `suspendida=true`, la ciudad desaparece del selector del formulario de agendamiento público y del listado de ciudades habilitadas. Las citas existentes no se ven afectadas. `(ver RF-34)`

- **RN-07:** El scheduler de `node-cron` se ejecuta cada hora. Para cada `ConfiguracionRecordatorio` activa, busca citas en estado `confirmado` cuya `fecha_hora` esté dentro del rango `(ahora + horas_antes - 30min, ahora + horas_antes + 30min)` y que no hayan recibido ya ese recordatorio (verificado en `historial_notificaciones`). `(ver RF-38)`

- **RN-08:** Los emails se envían de forma síncrona dentro del API Route que desencadena el evento. Si el envío falla (error de Resend), la operación principal (crear cita, cambiar estado) NO se revierte — el registro en BD se mantiene. Solo se registra el fallo en `historial_notificaciones`. `(ver RF-36, RF-37)`

- **RN-09:** Las contraseñas de usuarios se hashean con bcrypt (cost factor 12) antes de almacenarse. Nunca se almacena la contraseña en texto plano. `(ver RNF Seguridad)`

- **RN-10:** El bloqueo por intentos fallidos de login se implementa con un contador en memoria (o en BD si se requiere persistencia entre reinicios). Tras 5 intentos fallidos consecutivos, el sistema bloquea el email por 15 minutos. `(ver Flujo 3 — error de credenciales)`

- **RN-11:** Solo el usuario con rol `admin` puede acceder a las rutas `/(admin)` y `/api/v1/admin/*`. Solo el usuario con rol `tecnico` puede acceder a `/(tecnico)` y `/api/v1/tecnico/*`. El middleware de Auth.js verifica el rol en cada request. Un técnico no puede ver datos de otros técnicos — el API filtra por el `id` del usuario autenticado.

- **RN-12:** La sanitización de campos de texto en formularios del cliente se aplica en el servidor (API Route) antes de persistir: se eliminan tags HTML, se normalizan espacios y se aplica trim a todos los campos de tipo string. La validación del schema Zod se ejecuta antes de la sanitización. `(ver RF-06)`

- **RN-13:** El precio de los servicios y sub-productos es el vigente al momento del agendamiento. No se almacena snapshot del precio en la cita — el precio queda en `servicios.precio_mantenimiento`. Si se necesita historial de precios, se diferirá a v2.

- **RN-14:** La replicación de disponibilidad al resto del mes (RF-29) es una operación de escritura que genera registros individuales por fecha en caso de que el admin haya definido excepciones por día específico. En v1, si no hay excepciones por fecha, la disponibilidad se calcula siempre desde `disponibilidad_calendario` por `dia_semana`. La replicación solo aplica si el admin modifica un día de una semana futura y elige "aplicar al resto del mes".

- **RN-15:** El campo `ingresos_periodo` del dashboard se calcula sumando `servicios.precio_mantenimiento` de todas las citas en estado `completado` en el período seleccionado. No se toma precio de sub-productos en v1.

---

## 6. Manejo de Errores y Estados Alternos

| Escenario de error | Comportamiento esperado del sistema | Código / Mensaje al usuario |
|---|---|---|
| Campos inválidos en formulario de agendamiento | Validación Zod retorna errores por campo. React Hook Form muestra error inline por campo | 400 — `{ "errors": { "campo": "mensaje de error" } }` |
| Ciudad seleccionada no habilitada o suspendida | API retorna error antes de procesar la cita | 422 — "El servicio no está disponible en la ciudad seleccionada" |
| Slot de horario ya no disponible al confirmar | La disponibilidad puede cambiar entre que el usuario ve los slots y los confirma. El API valida al momento del submit | 422 — "El horario seleccionado ya no está disponible. Por favor elige otro horario" |
| No hay técnico disponible | Cita se crea en estado `emergencia`. Respuesta exitosa (201) pero con estado `emergencia` | 201 — `{ "estado": "emergencia", "mensaje": "Tu solicitud fue recibida y será confirmada pronto" }` |
| Fallo en envío de email (Resend error) | Se registra en `historial_notificaciones` con `estado=fallido`. La operación principal (crear/actualizar cita) NO se revierte | Sin error al usuario — la cita queda creada. Admin ve el fallo en el backoffice |
| Credenciales incorrectas en login | Auth.js retorna error genérico. Sin revelar si el email existe o no | "Credenciales incorrectas" |
| 5 intentos fallidos de login | Bloqueo del email por 15 minutos | "Tu cuenta está bloqueada temporalmente. Intenta nuevamente en 15 minutos" |
| Técnico intenta acceder a ruta de admin | Middleware redirige a `/tecnico/citas` | Redirección 302 |
| Admin intenta acceder a ruta de técnico | Middleware redirige a `/admin/dashboard` | Redirección 302 |
| Request no autenticado a ruta protegida | Middleware redirige a `/login` | Redirección 302 |
| Error interno del servidor (500) | Se loguea el error en el servidor. No se expone detalle al cliente | 500 — "Ocurrió un error interno. Por favor intenta nuevamente" |
| Cita en estado `emergencia` sin acción del admin | La cita permanece visible en el dashboard como alerta. El cron de recordatorios NO envía recordatorio a citas en estado `emergencia` | Sin acción automática — responsabilidad del admin |
| Fallo del scheduler node-cron | El proceso Next.js sigue funcionando. PM2 reinicia el proceso si falla. Los recordatorios perdidos no se recuperan en v1 | Sin notificación al usuario |

---

## 7. Seguridad y Acceso

- **Autenticación:** Auth.js v5 con Credentials provider (email + contraseña). Sesión almacenada como JWT en cookie httpOnly con `SameSite=Strict`. Expiración de sesión: 8 horas (configurable via `NEXTAUTH_SESSION_MAX_AGE`).
- **Autorización:** RBAC con dos roles: `admin` y `tecnico`. El middleware de Next.js (`middleware.ts`) verifica el token de sesión en cada request a rutas protegidas y valida el rol. Las API Routes también validan el rol del usuario de la sesión activa antes de procesar.
- **Datos sensibles:**
  - Contraseñas: hasheadas con bcrypt, cost factor 12. Nunca se retornan en responses de API.
  - Datos de clientes (nombre, email, teléfono, dirección): almacenados en texto plano en BD. Solo accesibles para usuarios autenticados con rol `admin` o `tecnico` (solo sus propias citas).
  - `NEXTAUTH_SECRET`: variable de entorno, nunca en el repositorio.
- **Sanitización de inputs:** Todos los campos de texto del cliente se sanitizan en el servidor antes de persistir (strip HTML, trim, normalización de espacios) usando DOMPurify o similar en el servidor.
- **Rate limiting:** En v1 se implementa rate limiting básico en el endpoint `POST /api/v1/public/citas` usando un middleware simple con contador en memoria (por IP): máximo 10 requests por minuto por IP. Si se supera, retorna 429.
- **CORS:** Solo se aceptan requests del mismo origen. Next.js maneja esto por defecto con las API Routes.
- **Headers de seguridad:** Se configuran en `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **HTTPS:** Solo en producción via Nginx + Certbot. En desarrollo se usa HTTP local.

---

## 8. Requisitos No Funcionales Técnicos

| Requisito | Especificación técnica | Cómo se implementa |
|---|---|---|
| Performance (LCP < 3s móvil) | Server Components de Next.js para el sitio público. Imágenes optimizadas con `next/image`. Sin bloqueos de JS en el render inicial | SSR de catálogo de servicios. Lazy load del componente de reels de YouTube. `next/image` para todas las imágenes |
| Disponibilidad 99% mensual | El proceso Next.js debe reiniciarse automáticamente ante fallos | PM2 configurado con `--watch` y `max_restarts`. Nginx como proxy con buffer ante reinicios |
| Responsive (320px+) | Todas las vistas deben funcionar en móvil desde 320px de ancho | Tailwind CSS con breakpoints `sm:`, `md:`, `lg:`. shadcn/ui usa Radix UI que es accesible y responsive por defecto |
| Accesibilidad WCAG 2.1 AA | Flujos principales del sitio público (catálogo, agendamiento, chat flotante) | shadcn/ui/Radix UI provee ARIA attributes. Revisar con axe-core en desarrollo. Contraste mínimo 4.5:1 |
| SEO | Meta tags por página, Open Graph, robots.txt, sitemap.xml | `next/head` o Metadata API de Next.js 14. `sitemap.xml` generado estáticamente. `robots.txt` en `/public` |
| Backups | pg_dump diario a las 03:00 AM (hora del servidor) | Script bash con `pg_dump`, comprimido con gzip, guardado en directorio `/backups` del VPS. Retención de 7 días |
| Observabilidad | Logs de errores del servidor y de emails fallidos | `console.error` estructurado en producción. PM2 guarda logs en archivos. `historial_notificaciones` como log de emails |

---

## 9. Dependencias Técnicas

| Dependencia | Tipo | Estado | Responsable | Impacto si no está |
|---|---|---|---|---|
| PostgreSQL en el VPS | Infraestructura | Pendiente de instalar | Equipo de desarrollo / DevOps | Bloquea todo el modelo de datos y el funcionamiento del sistema |
| Nginx + Certbot en el VPS | Infraestructura (prod) | Pendiente de configurar | Equipo de desarrollo / DevOps | Bloquea el acceso al sistema en producción con HTTPS |
| PM2 en el VPS | Infraestructura (prod) | Pendiente de instalar | Equipo de desarrollo / DevOps | Sin PM2, el proceso Next.js no persiste ante reinicios del servidor |
| Cuenta de Resend + dominio verificado | API externa | Pendiente de crear y configurar | Equipo de desarrollo | Sin esto, no se envían emails. Bloquea RF-11, RF-12, RF-13, RF-35, RF-38 |
| Dominio del negocio con DNS configurado | Infraestructura | Pendiente | Administrador del negocio | Sin dominio, Certbot no puede generar certificado SSL |
| Catálogo inicial de servicios y categorías | Datos | Pendiente | Administrador del negocio | Sin datos, el sitio público no muestra servicios — bloquea go-live |
| Ciudades y regiones habilitadas al lanzamiento | Datos | Pendiente | Administrador del negocio | Sin ciudades configuradas, el agendamiento no funciona |
| Al menos un técnico activo con ciudad asignada | Datos | Pendiente | Administrador del negocio | Sin técnicos, todas las citas quedan en estado `emergencia` |
| YouTube embed API | API externa (Google) | Disponible — sin key requerida | Sin gestión interna | Si YouTube bloquea embeds, los reels no se muestran. No bloquea el resto del sistema |

---

## 10. Estructura de Carpetas del Proyecto

```
/
├── app/
│   ├── (public)/                    # Sitio público (sin auth)
│   │   ├── page.tsx                 # Home: catálogo + reels + chat
│   │   ├── servicios/
│   │   │   └── page.tsx             # Catálogo completo de servicios
│   │   ├── repuestos/
│   │   │   └── page.tsx             # Catálogo de repuestos
│   │   ├── agendar/
│   │   │   └── page.tsx             # Formulario de agendamiento (multi-paso)
│   │   └── layout.tsx               # Layout público: navbar, footer, chat flotante
│   │
│   ├── (admin)/                     # Backoffice (rol: admin)
│   │   ├── layout.tsx               # Layout admin: sidebar + header
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── citas/
│   │   │   ├── page.tsx             # Lista de citas con filtros
│   │   │   └── [id]/page.tsx        # Detalle de cita
│   │   ├── calendario/
│   │   │   └── page.tsx             # Configuración de disponibilidad (FullCalendar)
│   │   ├── tecnicos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── servicios/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── repuestos/
│   │   │   └── page.tsx
│   │   ├── geografico/
│   │   │   └── page.tsx             # Regiones y ciudades
│   │   ├── notificaciones/
│   │   │   └── page.tsx
│   │   └── configuracion/
│   │       └── page.tsx             # Horario atención, recordatorios, redes sociales
│   │
│   ├── (tecnico)/                   # Portal técnico (rol: tecnico)
│   │   ├── layout.tsx
│   │   └── citas/
│   │       ├── page.tsx             # Lista de citas asignadas
│   │       └── [id]/page.tsx        # Detalle de cita + confirmar
│   │
│   ├── login/
│   │   └── page.tsx                 # Página de login (pública)
│   │
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts             # Auth.js handler
│       └── v1/
│           ├── public/              # Endpoints sin autenticación
│           ├── admin/               # Endpoints solo para admin
│           └── tecnico/             # Endpoints solo para técnico
│
├── components/
│   ├── ui/                          # Componentes shadcn/ui (copiados)
│   ├── public/                      # Componentes del sitio público
│   ├── admin/                       # Componentes del backoffice
│   └── tecnico/                     # Componentes del portal técnico
│
├── emails/                          # Plantillas React Email
│   ├── ConfirmacionCita.tsx
│   ├── NotificacionTecnico.tsx
│   ├── Recordatorio.tsx
│   ├── CancelacionCita.tsx
│   └── EmergenciaAdmin.tsx
│
├── lib/
│   ├── prisma.ts                    # Singleton del Prisma Client
│   ├── auth.ts                      # Configuración de Auth.js v5
│   ├── resend.ts                    # Cliente de Resend
│   ├── scheduler.ts                 # Inicialización de node-cron
│   ├── disponibilidad.ts            # Lógica de cálculo de slots disponibles
│   ├── asignacion-tecnico.ts        # Lógica de asignación automática de técnico
│   └── sanitize.ts                  # Sanitización de inputs (strip HTML, trim)
│
├── store/
│   └── agendamiento.ts              # Zustand store para el formulario multi-paso
│
├── prisma/
│   ├── schema.prisma                # Schema de la BD
│   └── migrations/                  # Migraciones generadas por Prisma
│
├── middleware.ts                    # Protección de rutas por rol (Auth.js)
├── next.config.js                   # Configuración de Next.js + security headers
├── tailwind.config.ts
├── tsconfig.json
└── .env.example                     # Variables de entorno documentadas (sin valores)
```

---

## 11. Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/electrodomesticos"

# Auth.js
NEXTAUTH_SECRET="string-aleatorio-minimo-32-chars"
NEXTAUTH_URL="https://dominio.com"  # En desarrollo: http://localhost:3000

# Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@dominio.com"

# App
NEXT_PUBLIC_APP_URL="https://dominio.com"
NODE_ENV="production"  # o "development"
```

---

## 12. Guía de Generación de Tasks

> **Instrucciones directas para el agente que genera tasks a partir de este SDD.**

### Criterios de agrupación
- Agrupa tasks por **funcionalidad de negocio**, no por tipo técnico
- Ejemplo correcto: `[Agendamiento] Implementar formulario multi-paso con validación y envío` (agrupa frontend + API + email)
- Ejemplo incorrecto: `[Backend] Todos los endpoints de citas` (mezcla funcionalidades)

### Granularidad esperada
- Una task = una unidad de trabajo completable en **menos de 1 día**
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

### Orden de generación de tasks
1. **Setup e infraestructura:** Inicializar proyecto Next.js, configurar Prisma + PostgreSQL, configurar Auth.js, configurar Resend, configurar PM2 + Nginx (docs/scripts)
2. **Modelo de datos:** Crear schema Prisma completo, generar y aplicar migraciones
3. **Autenticación y autorización:** Login, sesión, middleware de protección de rutas por rol
4. **API pública:** Endpoints de catálogo, disponibilidad y agendamiento
5. **Lógica de asignación de técnico:** Algoritmo de menor carga + estado emergencia
6. **Emails:** Plantillas React Email + integración con Resend para cada tipo de notificación
7. **Scheduler:** Configuración de node-cron + lógica de recordatorios
8. **Sitio público:** Catálogo de servicios, popup de detalle, reels YouTube, formulario de agendamiento multi-paso, chat flotante, redes sociales, dark mode, accesibilidad
9. **Backoffice — Dashboard:** Widgets de métricas
10. **Backoffice — Gestión de citas:** Lista con filtros, detalle, cambio de estado, asignación de técnico
11. **Backoffice — Calendario de disponibilidad:** Vista FullCalendar, editor de franjas, replicación al mes
12. **Backoffice — CRUDs:** Técnicos, servicios, sub-productos (precio masivo), repuestos, categorías, regiones/ciudades
13. **Backoffice — Notificaciones:** Historial, fallos
14. **Backoffice — Configuración:** Horario de atención, recordatorios, redes sociales
15. **Portal técnico:** Lista de citas, detalle, confirmación de comprensión
16. **SEO y performance:** Meta tags, sitemap, robots.txt, optimización de imágenes
17. **Backups:** Script pg_dump + cron del SO
18. **Tests:** Tests de las reglas de negocio críticas (RN-01 a RN-07) y endpoints principales

### Lo que NO debe convertirse en task todavía
- Integración con WhatsApp Business API (Out of Scope v1)
- Pago online (Out of Scope v1)
- Secciones marcadas como `[PENDIENTE]`

---

## Checklist de completitud

- [x] Cada RF del PRD tiene al menos un componente, endpoint o regla de negocio que lo implementa
- [x] Cada flujo del PRD tiene su manejo de error correspondiente en la sección 6
- [x] Cada dependencia externa del PRD aparece en la sección 9 con estado claro
- [x] No hay decisiones de diseño implícitas — todo está escrito explícitamente
- [x] La sección 12 tiene suficiente contexto para que el agente de tasks no necesite leer el PRD

---

*Fin del SDD. El siguiente paso es la generación de tasks por el agente correspondiente.*
