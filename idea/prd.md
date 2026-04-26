# PRD: Plataforma Web de Servicios de Mantenimiento de Electrodomésticos

> **Instrucciones para el LLM:**
> Este documento es un Product Requirements Document (PRD) estructurado.
> Tu tarea es leerlo completo antes de actuar, respetar el scope definido,
> y usar los flujos principales como base para cualquier output técnico (SDD, tasks, código).
> Si alguna sección está incompleta o marcada con `[PENDIENTE]`, detente y solicítala antes de continuar.

---

## Metadatos

| Campo     | Valor                          |
|-----------|--------------------------------|
| Versión   | 1.0                            |
| Fecha     | 2026-04-25                     |
| Autor     | [PENDIENTE]                    |
| Estado    | Draft                          |
| Producto  | Plataforma Web Electrodomésticos |

---

## 1. Contexto y Problema

- **Problema:** Los negocios de mantenimiento de electrodomésticos gestionan citas, técnicos y clientes de forma manual (teléfono, WhatsApp), lo que genera pérdida de solicitudes, dificultad para coordinar técnicos y falta de visibilidad sobre la operación.
- **A quién afecta:** Al administrador del negocio (que no puede escalar sin un sistema), a los técnicos (que reciben instrucciones desorganizadas) y a los clientes (que no pueden agendar de forma autónoma ni recibir confirmaciones automáticas).
- **Impacto actual:** Sin digitalización, el negocio pierde clientes por fricción en el agendamiento, no puede medir su rendimiento y no puede gestionar múltiples técnicos y ciudades de forma eficiente.
- **Por qué ahora:** El negocio requiere una presencia digital que le permita escalar operaciones, ofrecer autoservicio a los clientes y tener visibilidad en tiempo real sobre citas, técnicos e ingresos.

---

## 2. Objetivo

- **Objetivo principal:** Alcanzar entre 20 y 50 citas agendadas por mes a través del sitio web dentro de los primeros 90 días desde el lanzamiento.
- **Métrica principal:** Número de citas completadas registradas en el sistema por mes calendario.

---

## 3. Usuarios

### Usuario primario — Cliente final
- **Rol:** Persona que necesita mantenimiento de un electrodoméstico en su hogar.
- **Contexto:** Hoy llama por teléfono o envía un WhatsApp para solicitar el servicio. No tiene confirmación automática ni visibilidad del estado de su cita.
- **Caso de uso principal:** Ingresar al sitio, ver el catálogo de servicios, seleccionar el que necesita, indicar si requiere algún repuesto, ingresar sus datos y dirección, elegir fecha/hora disponible y recibir confirmación por correo.

### Usuario secundario — Administrador del negocio
- **Rol:** Dueño o gestor del negocio de mantenimiento.
- **Contexto:** Gestiona técnicos, citas, servicios y la operación general del negocio. Necesita visibilidad total y control sobre todos los recursos.
- **Caso de uso principal:** Revisar el panel de administración para ver citas del día, gestionar técnicos y ciudades, resolver emergencias de disponibilidad y configurar el catálogo de servicios.

### Usuario terciario — Técnico
- **Rol:** Profesional que realiza las visitas en terreno.
- **Contexto:** Hoy recibe instrucciones por teléfono o mensaje. No tiene visibilidad centralizada de sus citas del día.
- **Caso de uso principal:** Acceder al portal técnico desde el móvil para ver sus citas asignadas, los datos del cliente, dirección, servicio y confirmar comprensión de cada cita.

---

## 4. Propuesta de Valor

- **Qué mejora concreta ofrece:** Permite a los clientes agendar citas 24/7 de forma autónoma, recibir confirmación automática por correo y al negocio gestionar toda la operación desde un panel centralizado con visibilidad en tiempo real.
- **Cómo lo hacen hoy (alternativa actual):** Llamadas telefónicas y mensajes de WhatsApp manuales para coordinar cada visita, sin registro centralizado ni confirmaciones automáticas.
- **Por qué esta solución es mejor:** Elimina la fricción del agendamiento manual, automatiza las confirmaciones, asigna técnicos por carga de trabajo y da al administrador métricas reales para tomar decisiones.

---

## 5. Alcance

### ✅ In Scope (v1)

- Sitio web público responsive (mobile-first) con catálogo de servicios y repuestos
- Sección de videos de YouTube en formato reel vertical (scroll estilo Shorts/Instagram)
- Sistema de agendamiento online con selección de servicio, repuestos opcionales, datos del cliente, dirección, ciudad y fecha/hora
- Asignación automática de técnico por menor carga en la ciudad seleccionada
- Flujo de emergencia cuando no hay técnico disponible (estado "emergencia" + notificación al admin)
- Notificaciones por correo electrónico: confirmación de cita al cliente y al técnico asignado
- Recordatorios de visita por correo (periodicidad configurable)
- Backoffice con autenticación propia (usuario/contraseña) y dos roles: Administrador y Técnico
- Dashboard con métricas: citas del día/semana, ingresos del período, tasa de ocupación, servicios más solicitados, tasa de cancelación
- CRUD de servicios con sub-productos y atributos configurables
- CRUD de repuestos con relación a categorías
- CRUD de técnicos con asociación N:N a ciudades
- Mantenedor de regiones y ciudades habilitadas en Chile
- Calendario de disponibilidad semanal configurable por el admin
- Agenda de citas con estados: Pendiente → Confirmado → En curso → Completado / Cancelado / Emergencia
- Portal técnico mobile-first: ver citas asignadas y confirmar comprensión
- Chat flotante con formulario de contacto y horario de atención configurable
- Sección de redes sociales con enlaces gestionables desde el backoffice
- Modo dark y botón para agrandar texto
- Optimización SEO básica (meta tags, estructura semántica)
- Gestión de notificaciones fallidas en el backoffice

### ❌ Out of Scope (v1)

- Integración con WhatsApp Business API (diferida a v2)
- Pago online (el pago es siempre en terreno: efectivo o tarjeta al técnico)
- App móvil nativa (el portal técnico es web mobile-first)
- Integración con sistemas contables o ERP externos
- Chat en tiempo real con el técnico o el negocio
- Multiidioma
- Keywords SEO específicas (se definen post-lanzamiento)
- Catálogo inicial de productos/categorías (se carga manualmente una vez esté el sistema)

---

## 6. Flujos Principales

### Flujo 1: Agendamiento de cita por el cliente

**Happy path:**
1. El cliente ingresa al sitio y navega el catálogo de servicios.
2. El cliente selecciona un servicio y hace clic en la card para ver el detalle.
3. El cliente inicia el proceso de agendamiento: selecciona el servicio, indica si necesita algún repuesto del catálogo, ingresa sus datos personales, dirección y ciudad.
4. El sistema muestra los horarios disponibles para la ciudad seleccionada según el calendario configurado.
5. El cliente elige fecha y hora, y confirma el agendamiento.
6. El sistema crea la cita en estado "Pendiente", asigna automáticamente al técnico con menor carga habilitado en esa ciudad, y cambia el estado a "Confirmado".
7. El sistema envía un correo de confirmación al cliente con los detalles de la cita.
8. El sistema envía un correo de notificación al técnico asignado informando de la nueva cita.

**Estados de error / alternos:**
- Si no hay técnico disponible en la ciudad y fecha seleccionada: el sistema crea la cita en estado "Emergencia", notifica al admin por correo con el detalle de la cita marcada como emergencia, y muestra al cliente un mensaje indicando que su solicitud fue recibida y será confirmada pronto.
- Si el cliente ingresa datos inválidos (campos requeridos vacíos, formato de correo incorrecto): el sistema muestra errores de validación en línea y no avanza al siguiente paso.
- Si el cliente intenta agendar en una ciudad sin servicio habilitado: el sistema informa que el servicio no está disponible en esa ciudad.

---

### Flujo 2: Gestión de cita en estado Emergencia por el Admin

**Happy path:**
1. El admin recibe el correo de notificación de cita en estado "Emergencia".
2. El admin accede al backoffice y ubica la cita en la agenda o en el panel de notificaciones.
3. El admin evalúa la situación y decide **confirmar la visita** asignando manualmente un técnico disponible.
4. El sistema actualiza el estado de la cita a "Confirmado" y envía correo de confirmación al cliente y al técnico asignado.

**Estados de error / alternos:**
- Si el admin decide **cancelar la visita**: el sistema cambia el estado a "Cancelado" y envía automáticamente un correo al cliente informando la cancelación.
- Si el admin determina que no hay cobertura en esa ciudad: el sistema permite al admin marcar la ciudad como "suspendida temporalmente", lo que deshabilita nuevos agendamientos en esa ciudad hasta que se reactive.
- Si el admin no toma acción: la cita permanece en estado "Emergencia" visible en el dashboard como alerta activa.

---

### Flujo 3: Técnico consulta y confirma sus citas del día

**Happy path:**
1. El técnico recibe correo de notificación con nueva cita asignada.
2. El técnico accede al portal técnico desde su móvil con usuario y contraseña.
3. El sistema muestra el listado de citas asignadas ordenadas por fecha/hora.
4. El técnico selecciona una cita y ve el detalle: nombre del cliente, dirección, servicio solicitado, repuestos indicados y fecha/hora.
5. El técnico confirma que entendió la cita pulsando el botón de confirmación.
6. El sistema registra la confirmación del técnico y actualiza el estado interno.

**Estados de error / alternos:**
- Si el técnico no puede asistir a una cita: debe notificar al admin por el canal existente (fuera del sistema en v1). El admin reasigna manualmente desde el backoffice.
- Si el técnico ingresa credenciales incorrectas: el sistema muestra mensaje de error y bloquea tras N intentos fallidos.

---

### Flujo 4: Admin configura disponibilidad del calendario

**Happy path:**
1. El admin accede al módulo de calendario en el backoffice.
2. El admin selecciona una semana y hace clic en un día para configurar los horarios habilitados.
3. El sistema muestra un editor de franjas horarias para ese día.
4. El admin define los horarios disponibles y confirma.
5. El sistema replica automáticamente la configuración al resto del mes para los mismos días de la semana.
6. El sistema recalcula la disponibilidad visible para los clientes en el agendamiento.

**Estados de error / alternos:**
- Si el admin intenta deshabilitar un horario que ya tiene citas confirmadas: el sistema advierte el conflicto y solicita confirmación antes de proceder.
- Si el admin suspende una ciudad: el sistema oculta esa ciudad del formulario de agendamiento público hasta que se reactive.

---

## 7. Requisitos Funcionales

### Sitio Público

- RF-01: El sistema debe mostrar el catálogo de servicios en formato de cards con nombre, categoría, precio y descripción breve.
- RF-02: El sistema debe desplegar un popup con todos los detalles del servicio al hacer clic en una card.
- RF-03: El sistema debe mostrar videos de YouTube en formato de scroll vertical continuo sin redirigir al usuario fuera del sitio.
- RF-04: El sistema debe mostrar el catálogo de repuestos disponibles con relación a su categoría de servicio.
- RF-05: El sistema debe permitir al usuario iniciar el flujo de agendamiento desde el catálogo de servicios.
- RF-06: El sistema debe solicitar en el formulario de agendamiento: servicio seleccionado, repuestos opcionales del catálogo, nombre completo, correo electrónico, teléfono, dirección, ciudad y fecha/hora.
- RF-07: El sistema debe mostrar únicamente las ciudades habilitadas en el selector de ciudad del formulario de agendamiento.
- RF-08: El sistema debe mostrar únicamente los horarios disponibles según el calendario configurado y la carga existente de citas.
- RF-09: El sistema debe asignar automáticamente el técnico con menor cantidad de citas activas habilitado en la ciudad seleccionada.
- RF-10: El sistema debe crear la cita en estado "Emergencia" cuando no existe técnico disponible en la ciudad y fecha seleccionadas.
- RF-11: El sistema debe enviar un correo de confirmación al cliente al completar el agendamiento.
- RF-12: El sistema debe enviar un correo de notificación al técnico asignado al crear una nueva cita.
- RF-13: El sistema debe notificar al administrador por correo cuando una cita quede en estado "Emergencia".
- RF-14: El sistema debe mostrar un botón flotante de contacto que abre un formulario (no un chat de WhatsApp).
- RF-15: El sistema debe mostrar el estado del horario de atención (disponible / fuera de horario) en el chat flotante según configuración del admin.
- RF-16: El sistema debe ofrecer un botón para aumentar el tamaño del texto.
- RF-17: El sistema debe ofrecer un modo oscuro (dark mode) activable por el usuario.
- RF-18: El sistema debe mostrar una sección de redes sociales con los enlaces configurados desde el backoffice.

### Backoffice — Administrador

- RF-19: El sistema debe permitir al administrador autenticarse con correo electrónico y contraseña.
- RF-20: El sistema debe mostrar un dashboard con widgets de: citas del día/semana, ingresos del período, tasa de ocupación del técnico, servicios más solicitados y tasa de cancelación.
- RF-21: El sistema debe permitir al administrador crear, editar y eliminar servicios con sus campos: nombre, categoría, descripción y precio de mantenimiento.
- RF-22: El sistema debe permitir al administrador crear, editar y eliminar sub-productos con atributos configurables de tipo texto, número o selección, y precio propio.
- RF-23: El sistema debe permitir la asignación de precios masivos a múltiples sub-productos seleccionados simultáneamente.
- RF-24: El sistema debe permitir al administrador crear, editar y eliminar repuestos con relación a categoría de servicio.
- RF-25: El sistema debe permitir al administrador crear, editar y eliminar técnicos con sus datos básicos.
- RF-26: El sistema debe permitir la asociación N:N entre técnicos y ciudades.
- RF-27: El sistema debe permitir al administrador mantener regiones y ciudades de Chile, habilitándolas o deshabilitándolas para agendamiento.
- RF-28: El sistema debe permitir al administrador configurar el calendario de disponibilidad semanal con franjas horarias por día.
- RF-29: El sistema debe replicar automáticamente la configuración de disponibilidad de un día al resto del mismo día de la semana en el mes.
- RF-30: El sistema debe advertir al administrador si intenta deshabilitar un horario que ya contiene citas confirmadas.
- RF-31: El sistema debe permitir al administrador ver todas las citas con sus estados y filtrarlas por fecha, técnico y estado.
- RF-32: El sistema debe permitir al administrador cambiar el estado de una cita manualmente.
- RF-33: El sistema debe permitir al administrador asignar o reasignar un técnico a una cita manualmente.
- RF-34: El sistema debe permitir al administrador marcar una ciudad como "suspendida temporalmente", ocultándola del agendamiento público.
- RF-35: El sistema debe enviar un correo automático al cliente cuando el administrador cancela una cita.
- RF-36: El sistema debe mantener un historial de todas las notificaciones enviadas con su estado (enviada / fallida).
- RF-37: El sistema debe mostrar las notificaciones fallidas con detalle del error, permitiendo al admin decidir la acción a tomar.
- RF-38: El sistema debe permitir al administrador configurar la periodicidad de los recordatorios de visita por correo (ej: 24h antes, 2h antes).
- RF-39: El sistema debe permitir al administrador configurar el horario de atención para el chat flotante.
- RF-40: El sistema debe permitir al administrador agregar, editar y eliminar enlaces de redes sociales visibles en el sitio público.

### Portal Técnico

- RF-41: El sistema debe permitir al técnico autenticarse con correo electrónico y contraseña, con acceso restringido solo al portal técnico.
- RF-42: El sistema debe mostrar al técnico el listado de sus citas asignadas ordenadas cronológicamente.
- RF-43: El sistema debe mostrar al técnico el detalle de cada cita: nombre del cliente, dirección, servicio, repuestos indicados, fecha y hora.
- RF-44: El sistema debe permitir al técnico registrar la confirmación de comprensión de una cita.

---

## 8. Requisitos No Funcionales

- **Performance:** Las páginas del sitio público deben cargar en menos de 3 segundos en conexión móvil 4G (LCP < 3s).
- **Seguridad:** Las contraseñas deben almacenarse con hash (bcrypt o equivalente). Las sesiones deben tener expiración configurable. El acceso al backoffice debe estar restringido por rol.
- **Disponibilidad:** El sistema debe tener una disponibilidad mínima del 99% mensual.
- **Responsive:** Todas las interfaces (sitio público, backoffice y portal técnico) deben ser completamente funcionales en dispositivos móviles (320px+) y escritorio.
- **Accesibilidad:** El sitio público debe seguir las pautas WCAG 2.1 nivel AA en los flujos principales.
- **SEO:** El sitio debe tener meta tags configurables, URLs semánticas y estructura HTML correcta para indexación.

---

## 9. Dependencias Externas

| Dependencia | Tipo | Responsable | Riesgo si no está disponible |
|---|---|---|---|
| Proveedor de email transaccional (ej: SendGrid, Resend, SES) | API / Servicio externo | Equipo de desarrollo | Sin proveedor configurado, no se envían confirmaciones ni recordatorios — el sistema no puede operar |
| YouTube embed API | API externa (Google) | Sin gestión interna | Si YouTube cambia su política de embeds, los reels dejan de funcionar |
| Catálogo inicial de servicios y categorías | Datos del negocio | Administrador del negocio | Sin datos iniciales cargados, el sitio no puede lanzarse — bloqueante para go-live |
| Ciudades habilitadas al lanzamiento | Datos del negocio | Administrador del negocio | Sin ciudades configuradas, el agendamiento no funciona |
| WhatsApp Business API | API externa (v2) | [PENDIENTE v2] | Diferida — no bloquea v1 |

---

## 10. Métricas de Éxito

| Métrica | Baseline actual | Meta | Plazo |
|---|---|---|---|
| Citas completadas por mes | 0 (lanzamiento nuevo) | 20–50 citas/mes | 90 días post-lanzamiento |
| Tasa de cancelación | [Sin baseline] | < 15% | 90 días post-lanzamiento |
| Tasa de citas en estado Emergencia | [Sin baseline] | < 10% del total | 90 días post-lanzamiento |
| Tiempo de confirmación de cita (automatizado) | Manual / variable | < 5 minutos desde el agendamiento | Desde el día 1 |

---

## 11. Riesgos y Supuestos

### Supuestos clave

- Se asume que el negocio tiene al menos un técnico operativo al momento del lanzamiento.
- Se asume que el administrador cargará el catálogo de servicios antes del go-live.
- Se asume que el administrador configurará al menos una ciudad habilitada y el calendario de disponibilidad antes del go-live.
- Se asume que el proveedor de email transaccional estará configurado y aprobado antes del lanzamiento.
- Se asume que los videos de YouTube ya existen en un canal del negocio y se proveerán las URLs para el sistema.
- Se asume que el pago siempre es en terreno (efectivo o tarjeta al técnico) y no se requiere pasarela de pago online en v1.

### Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Scope demasiado amplio para v1: todo fue declarado como MVP | Alta | Alto | Priorizar el flujo de agendamiento + backoffice básico. Si el tiempo apremia, diferir reels y dashboard a v1.1 |
| No hay datos cargados al lanzamiento (catálogo, ciudades, técnicos) | Media | Alto | Definir un checklist de go-live con responsable explícito (admin del negocio) |
| El proveedor de email transaccional no está configurado a tiempo | Media | Alto | Iniciar la configuración del proveedor en paralelo al desarrollo, no al final |
| El técnico no adopta el portal móvil y sigue usando WhatsApp | Media | Medio | Diseño mobile-first muy simple; el admin puede reforzar con notificaciones por correo que incluyan el link directo a la cita |
| Citas en estado Emergencia sin resolución oportuna del admin | Media | Medio | Mostrar las emergencias como alerta prioritaria en el dashboard; considerar recordatorio al admin si pasan X horas sin resolución |

---

## Checklist de completitud

- [x] ¿Qué problema resolvemos y por qué importa?
- [x] ¿Para quién es y cuál es su caso de uso principal?
- [x] ¿Cómo sabremos que funcionó?

---

*Fin del PRD. El siguiente paso es el SDD (Software Design Document).*
