-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'tecnico');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado', 'emergencia');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('enviado', 'fallido');

-- CreateEnum
CREATE TYPE "TipoAtributo" AS ENUM ('texto', 'numero', 'seleccion');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'tecnico',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regiones" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "region_id" TEXT NOT NULL,
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "suspendida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecnicos_ciudades" (
    "tecnico_id" TEXT NOT NULL,
    "ciudad_id" TEXT NOT NULL,

    CONSTRAINT "tecnicos_ciudades_pkey" PRIMARY KEY ("tecnico_id","ciudad_id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio_mantenimiento" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_productos" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atributos_sub_producto" (
    "id" TEXT NOT NULL,
    "sub_producto_id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" "TipoAtributo" NOT NULL,
    "opciones" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atributos_sub_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repuestos" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "categoria_id" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_calendario" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" VARCHAR(5) NOT NULL,
    "horaFin" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilidad_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "tecnico_id" TEXT,
    "ciudad_id" TEXT NOT NULL,
    "cliente_nombre" VARCHAR(100) NOT NULL,
    "cliente_email" VARCHAR(255) NOT NULL,
    "cliente_telefono" VARCHAR(20) NOT NULL,
    "cliente_direccion" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'pendiente',
    "confirmado_tecnico" BOOLEAN NOT NULL DEFAULT false,
    "notas_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas_repuestos" (
    "cita_id" TEXT NOT NULL,
    "repuesto_id" TEXT NOT NULL,

    CONSTRAINT "citas_repuestos_pkey" PRIMARY KEY ("cita_id","repuesto_id")
);

-- CreateTable
CREATE TABLE "configuracion_recordatorios" (
    "id" TEXT NOT NULL,
    "horas_antes" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_notificaciones" (
    "id" TEXT NOT NULL,
    "cita_id" TEXT,
    "tipo" VARCHAR(50) NOT NULL,
    "destinatario" VARCHAR(255) NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL,
    "error_detalle" TEXT,
    "enviado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" TEXT NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redes_sociales" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL,
    "icono" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redes_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "citas_fecha_hora_idx" ON "citas"("fecha_hora");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE INDEX "citas_tecnico_id_idx" ON "citas"("tecnico_id");

-- CreateIndex
CREATE INDEX "historial_notificaciones_estado_idx" ON "historial_notificaciones"("estado");

-- CreateIndex
CREATE INDEX "historial_notificaciones_cita_id_idx" ON "historial_notificaciones"("cita_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos_ciudades" ADD CONSTRAINT "tecnicos_ciudades_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecnicos_ciudades" ADD CONSTRAINT "tecnicos_ciudades_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_productos" ADD CONSTRAINT "sub_productos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos_sub_producto" ADD CONSTRAINT "atributos_sub_producto_sub_producto_id_fkey" FOREIGN KEY ("sub_producto_id") REFERENCES "sub_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_repuestos" ADD CONSTRAINT "citas_repuestos_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_repuestos" ADD CONSTRAINT "citas_repuestos_repuesto_id_fkey" FOREIGN KEY ("repuesto_id") REFERENCES "repuestos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_notificaciones" ADD CONSTRAINT "historial_notificaciones_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
