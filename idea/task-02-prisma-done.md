# TASK-02 · Crear modelo de datos completo en Prisma + migraciones

> **Grupo funcional:** Modelo de datos
> **Referencia SDD:** § 3 (Modelo de Datos), § 10 (Estructura de Carpetas — prisma/schema.prisma)
> **Referencia PRD:** RF-01 a RF-44 (todas las entidades del sistema)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-02 — Modelo de datos Prisma |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea toda la lógica de negocio y endpoints |
| Tipo | DB |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El `prisma/schema.prisma` creado en TASK-01 solo tiene el esqueleto de entidades. En esta task se completa el schema completo con todas las entidades, relaciones, enums, índices y constrain­tes definidos en el SDD § 3. También se genera y ejecuta la migración inicial contra PostgreSQL.

---

## Lo que hay que hacer

### 1. Completar el schema Prisma con todas las entidades

Reemplazar todo el contenido de `prisma/schema.prisma` con el schema completo siguiente. Cada bloque incluye la definición de la entidad, sus campos, relaciones y comentarios.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// ENUMS
// =============================================

enum Rol {
  admin
  tecnico
}

enum EstadoCita {
  pendiente
  confirmado
  en_curso
  completado
  cancelado
  emergencia
}

enum EstadoNotificacion {
  enviado
  fallido
}

enum TipoAtributo {
  texto
  numero
  seleccion
}

// =============================================
// USUARIOS (users)
// =============================================

model User {
  id           String   @id @default(uuid())
  nombre       String   @db.VarChar(100)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash")
  rol          Rol      @default(tecnico)
  activo       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  tecnicoCiudades  TecnicoCiudad[]
  citasTecnico     Cita[]         @relation("TecnicoAsignado")
  createdCitas     Cita[]         @relation("CitasCreadas")

  @@map("users")
}

// =============================================
// REGIONES
// =============================================

model Region {
  id        String   @id @default(uuid())
  nombre    String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")

  ciudades Ciudad[]

  @@map("regiones")
}

// =============================================
// CIUDADES
// =============================================

model Ciudad {
  id         String   @id @default(uuid())
  nombre     String   @db.VarChar(100)
  regionId   String   @map("region_id")
  habilitada Boolean  @default(true)
  suspendida Boolean  @default(false)
  createdAt  DateTime @default(now()) @map("created_at")

  region         Region          @relation(fields: [regionId], references: [id])
  tecnicosCiudad TecnicoCiudad[]
  citas          Cita[]

  @@map("ciudades")
}

// =============================================
// TÉCNICO × CIUDAD (relación N:N)
// =============================================

model TecnicoCiudad {
  tecnicoId  String @map("tecnico_id")
  ciudadId   String @map("ciudad_id")

  tecnico User   @relation("TecnicoAsignado", fields: [tecnicoId], references: [id])
  ciudad  Ciudad @relation(fields: [ciudadId], references: [id])

  @@id([tecnicoId, ciudadId])
  @@map("tecnicos_ciudades")
}

// =============================================
// CATEGORÍAS
// =============================================

model Categoria {
  id        String   @id @default(uuid())
  nombre    String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")

  servicios  Servicio[]
  repuestos  Repuesto[]

  @@map("categorias")
}

// =============================================
// SERVICIOS
// =============================================

model Servicio {
  id                 String   @id @default(uuid())
  nombre             String   @db.VarChar(150)
  categoriaId        String   @map("categoria_id")
  descripcion        String   @db.Text
  precioMantenimiento Decimal  @db.Decimal(10, 2) @map("precio_mantenimiento")
  activo             Boolean  @default(true)
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  categoria     Categoria      @relation(fields: [categoriaId], references: [id])
  subProductos  SubProducto[]
  citas         Cita[]

  @@map("servicios")
}

// =============================================
// SUB-PRODUCTOS
// =============================================

model SubProducto {
  id         String   @id @default(uuid())
  servicioId String   @map("servicio_id")
  nombre     String   @db.VarChar(150)
  precio     Decimal  @db.Decimal(10, 2)
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  servicio    Servicio              @relation(fields: [servicioId], references: [id])
  atributos   AtributoSubProducto[]

  @@map("sub_productos")
}

// =============================================
// ATRIBUTOS DE SUB-PRODUCTO
// =============================================

model AtributoSubProducto {
  id              String       @id @default(uuid())
  subProductoId   String       @map("sub_producto_id")
  nombre          String       @db.VarChar(100)
  tipo            TipoAtributo
  opciones        Json?        // array de strings si tipo = seleccion
  createdAt       DateTime     @default(now()) @map("created_at")

  subProducto SubProducto @relation(fields: [subProductoId], references: [id])

  @@map("atributos_sub_producto")
}

// =============================================
// REPUESTOS
// =============================================

model Repuesto {
  id           String   @id @default(uuid())
  nombre       String   @db.VarChar(150)
  descripcion  String?  @db.Text
  categoriaId  String   @map("categoria_id")
  disponible   Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  categoria   Categoria     @relation(fields: [categoriaId], references: [id])
  citasRepuestos CitaRepuesto[]

  @@map("repuestos")
}

// =============================================
// DISPONIBILIDAD CALENDARIO
// =============================================

model DisponibilidadCalendario {
  id         String   @id @default(uuid())
  diaSemana  Int      // 0 = Lunes, 6 = Domingo
  horaInicio String   @db.VarChar(5) // "09:00"
  horaFin    String   @db.VarChar(5) // "18:00"
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("disponibilidad_calendario")
}

// =============================================
// CITAS
// =============================================

model Cita {
  id                String      @id @default(uuid())
  servicioId        String      @map("servicio_id")
  tecnicoId         String?     @map("tecnico_id")
  ciudadId          String      @map("ciudad_id")
  clienteNombre     String      @db.VarChar(100) @map("cliente_nombre")
  clienteEmail      String      @db.VarChar(255) @map("cliente_email")
  clienteTelefono   String      @db.VarChar(20) @map("cliente_telefono")
  clienteDireccion  String      @db.Text @map("cliente_direccion")
  fechaHora         DateTime    @map("fecha_hora")
  estado            EstadoCita  @default(pendiente)
  confirmadoTecnico Boolean     @default(false) @map("confirmado_tecnico")
  notasAdmin        String?     @db.Text @map("notas_admin")
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  servicio       Servicio        @relation(fields: [servicioId], references: [id])
  tecnico        User?           @relation("TecnicoAsignado", fields: [tecnicoId], references: [id])
  ciudad         Ciudad          @relation(fields: [ciudadId], references: [id])
  repuestos      CitaRepuesto[]
  notificaciones  HistorialNotificacion[]

  @@index([fechaHora])
  @@index([estado])
  @@index([tecnicoId])
  @@map("citas")
}

// =============================================
// CITA × REPUESTO (relación N:N)
// =============================================

model CitaRepuesto {
  citaId      String @map("cita_id")
  repuestoId  String @map("repuesto_id")

  cita     Cita     @relation(fields: [citaId], references: [id])
  repuesto Repuesto @relation(fields: [repuestoId], references: [id])

  @@id([citaId, repuestoId])
  @@map("citas_repuestos")
}

// =============================================
// CONFIGURACIÓN DE RECORDATORIOS
// =============================================

model ConfiguracionRecordatorio {
  id         String   @id @default(uuid())
  horasAntes Int      @map("horas_antes")
  activo     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("configuracion_recordatorios")
}

// =============================================
// HISTORIAL DE NOTIFICACIONES
// =============================================

model HistorialNotificacion {
  id           String            @id @default(uuid())
  citaId       String?           @map("cita_id")
  tipo         String            @db.VarChar(50) // confirmacion_cliente, notif_tecnico, recordatorio, cancelacion, emergencia_admin
  destinatario String            @db.VarChar(255)
  estado       EstadoNotificacion
  errorDetalle String?           @db.Text @map("error_detalle")
  enviadoAt    DateTime          @default(now()) @map("enviado_at")

  cita Cita? @relation(fields: [citaId], references: [id])

  @@index([estado])
  @@index([citaId])
  @@map("historial_notificaciones")
}

// =============================================
// CONFIGURACIÓN DEL SISTEMA (clave-valor)
// =============================================

model ConfiguracionSistema {
  id          String   @id @default(uuid())
  clave       String   @unique @db.VarChar(100)
  valor       String   @db.Text
  descripcion String?  @db.Text
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("configuracion_sistema")
}

// =============================================
// REDES SOCIALES
// =============================================

model RedSocial {
  id      String   @id @default(uuid())
  nombre  String   @db.VarChar(50)
  url     String   @db.Text
  icono   String?   @db.VarChar(50)
  orden   Int      @default(0)
  activo  Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("redes_sociales")
}
```

### 2. Crear archivo `.env` local

Copiar `.env.example` a `.env` y completar los valores. En desarrollo local, PostgreSQL corre en `localhost:5432`.

```bash
cp .env.example .env
# Editar DATABASE_URL con las credenciales locales
```

### 3. Generar la migración inicial

```bash
npx prisma migrate dev \
  --name init \
  --create-only
```

Revisar el archivo generado en `prisma/migrations/` antes de aplicar. Si hay errores de sintaxis, corregirlos y volver a generar.

### 4. Aplicar la migración

```bash
npx prisma migrate dev --name init
```

Esto crea las tablas en PostgreSQL.

### 5. Generar el cliente Prisma

```bash
npx prisma generate
```

Esto genera el cliente en `node_modules/@prisma/client` para poder importarlo desde `lib/prisma.ts`.

### 6. Verificar que el cliente Prisma funciona

Crear un archivo de test temporal `scripts/test-prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const count = await prisma.user.count()
  console.log('Users table OK:', count)
  await prisma.$disconnect()
}

test().catch(console.error)
```

Ejecutar con `npx tsx scripts/test-prisma.ts`. Luego eliminar el archivo.

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] El `schema.prisma` tiene todas las entidades, enums, relaciones y campos del SDD § 3
- [ ] La migración se genera sin errores (`npx prisma migrate dev --name init` exitoso)
- [ ] `npx prisma generate` genera el cliente sin errores
- [ ] Las tablas existen en PostgreSQL (`npx prisma studio` las muestra correctamente)
- [ ] El archivo `.env` tiene `DATABASE_URL` apuntando a PostgreSQL local
- [ ] `lib/prisma.ts` importa y exporta `new PrismaClient()` correctamente
- [ ] `npx prisma studio` abre y muestra todas las entidades en el navegador

---

## Dependencias

- Requiere: TASK-01 — el schema.prisma esqueleto y la estructura del proyecto
- Bloquea: TASK-03 (Auth) — Auth.js necesita Prisma Adapter que a su vez requiere el schema completo
- Bloquea: TASK-05 (API pública) — no se pueden escribir endpoints sin el modelo de datos
- Bloquea: TASK-06 (Lógica de asignación) — necesita `lib/prisma.ts` para hacer queries

---

## Notas para el ejecutor

- Revisar cada modelo contra el SDD § 3 para confirmar que ningún campo esté faltante
- Los enum `Rol`, `EstadoCita`, `EstadoNotificacion`, `TipoAtributo` deben crearse como enum nativo de PostgreSQL, no como string
- Los `@map()` attributes generan nombres de columna snake_case en PostgreSQL
- `Decimal` en Prisma se mapea a `numeric` en PostgreSQL
- `Json` en Prisma se mapea a `jsonb` en PostgreSQL
- Asegurarse de que PostgreSQL esté corriendo y la base de datos `electrodomesticos` exista antes de correr la migración:

```bash
# Crear la base de datos si no existe
psql -U postgres -c "CREATE DATABASE electrodomesticos;"
```

- El orden de ejecución de los modelos importa para las foreign keys. Si Prisma rechaza por referencias a modelos no existentes, reordenar: User, Region, Ciudad, Categoria, Servicio, SubProducto, AtributoSubProducto, Repuesto, DisponibilidadCalendario, Cita, CitaRepuesto, ConfiguracionRecordatorio, HistorialNotificacion, ConfiguracionSistema, RedSocial, TecnicoCiudad.

---

## Checklist de cierre

- [ ] `npx prisma migrate dev --name init` exitoso
- [ ] `npx prisma generate` exitoso
- [ ] Las 15 tablas existen en PostgreSQL
- [ ] `npx prisma studio` muestra todas las entidades
- [ ] El archivo `.env` está configurado (no commitear valores reales)

---

*Fin de TASK-02. Siguiente: TASK-03 — Configurar autenticación Auth.js v5 con Credentials*