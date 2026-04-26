# Página Web de Servicios de Mantenimiento de Electrodomésticos

## 1. Propósito General
Sitio web responsive (mobile-first) para ofrecer y gestionar servicios de mantenimiento de electrodomésticos caseros, con agendamiento en línea y panel de administración.

## 2. Frontend (Público)

### 2.1 Contenido Principal
- Videos de YouTube mostrados en formato de reels vertical (scroll estilo Instagram/YouTube Shorts), sin salir del sitio
- Catálogo de servicios con cards que muestran: nombre, categoría, precio y descripción breve
- Al hacer clic en una card, se despliega un popup con todos los detalles del servicio
- Sección de repuestos disponibles

### 2.2 Agendamiento
- Sistema para agendar hora de visita
- Al agendar, el usuario selecciona el servicio que necesita
- Se solicita: servicio a contratar, datos del cliente, dirección, ciudad, fecha/hora seleccionada
- Todo queda registrado en el sistema
- Medio de pago: solo en terreno (efectivo/tarjeta al técnico)

### 2.3 Accesibilidad y SEO
- Botón para agrandar letra
- Modo dark
- Seguir buenas prácticas de accesibilidad
- Optimización SEO (keywords por definir)

### 2.4 Chat Flotante
- Botón flotante para contacto rápido
- Formulario de contacto (no chat directo de WhatsApp)
- Horario de atención configurable (mostrar "fuera de horario" si corresponde)

### 2.5 Redes Sociales
- Sección con enlaces a redes sociales
- Los enlaces se pueden ir agregando desde el backoffice

## 3. Backoffice (Administración)

### 3.1 Usuarios y Roles
- 2 roles separados: Administrador y Técnico
- Administrador: acceso completo al panel
- Técnico: solo acceso al portal técnico (ver horas asignadas, confirmar citas)

### 3.2 Dashboard Interactivo
Widgets:
- Citas del día/semana
- Ingresos del período
- Tasa de ocupación del técnico
- Servicios más solicitados
- Tasa de cancelación

### 3.3 Gestión Geográfica
- Mantenedor de regiones y ciudades habilitadas en Chile
- Relación técnico-ciudad: N:N (un técnico puede cubrir 1 o todas las ciudades; una ciudad puede tener varios técnicos)

### 3.4 Gestión de Servicios
- Carga de productos/servicios desde el día 1
- Modelo de datos por servicio:
  - Nombre
  - Categoría
  - Descripción
  - Precio de mantenimiento
- Modelo de datos por sub-producto:
  - Nombre
  - Atributos configurables (tipo: texto, número o selección)
  - Precio por sub-producto
- Selección múltiple de sub-productos para asignar precio masivo
- Los precios pueden cambiar

### 3.5 Gestión de Repuestos
- Sección para administrar repuestos a la venta
- Relación con productos mediante categoría

### 3.6 Agenda de Horas
- Revisar horas agendadas
- Ver citas programadas
- Estados: Pendiente → Confirmado → En curso → Completado / Cancelado

### 3.7 Calendario de Disponibilidad
- Vista tipo calendario semanal editable por el admin
- Click en cada día para configurar horarios habilitados
- Configuración se replica al resto del mes automáticamente
- Calcula horas disponibles según carga existente

### 3.8 Gestión de Notificaciones
- Historial de todas las notificaciones enviadas
- Sección con notificaciones fallidas
- Admin puede ver detalle de cada fallo y decidir resolución

## 4. Notificaciones

### 4.1 Recordatorios de Visita
- Configurables por WhatsApp o correo electrónico
- Periodicidad configurable (ej: 24h antes, 2h antes)

### 4.2 Notificaciones de Agendamiento
- Se envían al usuario (confirmando su cita)
- Se envían al técnico (avisando de la nueva hora agendada)

## 5. Técnico

### 5.1 Portal Técnico
- Portal mobile-first para ver horas asignadas
- Ver detalles de cada cita: cliente, dirección, servicio, fecha/hora
- Confirmar comprensión de la cita

### 5.2 Asignación de Citas
- Asignación automática al técnico con menos carga habilitado en la ciudad
- Si el técnico no puede asistir: admin reasigna (manual o automáticamente)

## 6. Backoffice - Sección Técnico
- CRUD de técnicos
- Asociación técnico-ciudad (N:N)
- Ver listado de técnicos disponibles
- Ver carga de trabajo de cada técnico

## 7. Datos no Específicos (Pendientes)
- Keywords SEO: por definir
- Catálogo inicial de categorías/sub-productos: se cargará una vez esté la web
