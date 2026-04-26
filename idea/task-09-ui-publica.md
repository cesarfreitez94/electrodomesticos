# TASK-09 · Construir UI del sitio público

> **Grupo funcional:** Frontend público
> **Referencia SDD:** § 10 (Estructura de carpetas — app/(public)), § 4.1 (API pública — endpoints)
> **Referencia PRD:** RF-01 a RF-18 (sitio público completo), RNF (responsive, accesibilidad, dark mode)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-09 — UI del sitio público |
| Estimación | M (4–8 horas) |
| Prioridad | Alta — bloquea TASK-17 (SEO) |
| Tipo | Frontend |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

El sitio público es la cara visible del negocio. Incluye home con catálogo de servicios (cards con popup de detalle), sección de reels de YouTube vertical, formulario de agendamiento multi-paso, chat flotante, sección de redes sociales, dark mode y botón para agrandar texto. Todo responsive desde 320px y accesible (WCAG 2.1 AA). Depende de TASK-05 (API pública).

---

## Lo que hay que hacer

### 1. Estructura de carpetas del sitio público

```
app/(public)/
├── layout.tsx          # Layout: navbar, footer, chat flotante
├── page.tsx            # Home: catálogo services cards + reels + chat
├── servicios/
│   └── page.tsx        # Catálogo completo de servicios
├── repuestos/
│   └── page.tsx        # Catálogo de repuestos
└── agendar/
    └── page.tsx        # Formulario multi-paso de agendamiento
```

### 2. Componentes UI públicos

Crear carpeta `components/public/` con los siguientes componentes:

- `ServiceCard.tsx` — Card de servicio con nombre, categoría, precio, descripción breve
- `ServicePopup.tsx` — Dialog con detalle completo + sub-productos + botón agendar
- `ReelsYouTube.tsx` — Sección de reels vertical (scroll vertical con iframes de YouTube)
- `AgendamientoForm.tsx` — Formulario multi-paso completo
- `ChatFlotante.tsx` — Botón flotante + panel con formulario de contacto y estado horario
- `RedesSociales.tsx` — Sección de enlaces a redes sociales
- `DarkModeToggle.tsx` — Toggle dark mode + store en localStorage/Zustand
- `AccesibilidadToggle.tsx` — Botón para agrandar texto (CSS font-size)
- `Navbar.tsx` — Navegación superior
- `Footer.tsx` — Pie de página con enlaces y redes sociales

### 3. Layout público `app/(public)/layout.tsx`

```tsx
import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'
import { ChatFlotante } from '@/components/public/ChatFlotante'
import { DarkModeToggle } from '@/components/public/DarkModeToggle'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatFlotante />
      <DarkModeToggle />
    </div>
  )
}
```

El Navbar debe tener:
- Logo/nombre del negocio
- Links a: Inicio, Servicios, Repuestos, Agendar
- Botón de dark mode integrado o separado

### 4. Home `app/(public)/page.tsx`

Página home que combina:
1. Hero section con título y CTA "Agendar ahora"
2. Catálogo de servicios en grid de cards (fetch desde `/api/v1/public/servicios`)
3. Sección de reels de YouTube (scroll vertical)
4. Chat flotante (componente)

```tsx
import { ServiceCard } from '@/components/public/ServiceCard'
import { ReelsYouTube } from '@/components/public/ReelsYouTube'

async function getServicios() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/public/servicios`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const servicios = await getServicios()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Servicio técnico de electrodomésticos
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Agenda tu próxima visita en minutos. Técnicos certificados en tu ciudad.
        </p>
        <a
          href="/agendar"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
        >
          Agendar ahora
        </a>
      </section>

      {/* Catálogo */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Nuestros servicios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio: any) => (
            <ServiceCard key={servicio.id} servicio={servicio} />
          ))}
        </div>
      </section>

      {/* Reels YouTube — URLs configurables desde backoffice (v2) */}
      <ReelsYouTube
        videos={[
          'https://www.youtube.com/embed/video1',
          'https://www.youtube.com/embed/video2',
          'https://www.youtube.com/embed/video3',
        ]}
      />
    </div>
  )
}
```

### 5. Catálogo completo `app/(public)/servicios/page.tsx`

Grid de todas las cards con filtro por categoría. Misma estructura que la sección de la home pero completa y con filtro.

### 6. Repuestos `app/(public)/repuestos/page.tsx`

Página con fetching a `/api/v1/public/repuestos`, agrupados por categoría. Cada grupo tiene título de categoría y lista de repuestos.

### 7. Formulario de agendamiento multi-paso `app/(public)/agendar/page.tsx`

El formulario tiene 5 pasos:

**Paso 1 — Seleccionar servicio**
- Mostrar grid de servicios (fetch `/api/v1/public/servicios`)
- Click en servicio → marcar seleccionado
- Botón "Siguiente" habilitado cuando hay selección

**Paso 2 — Repuestos opcionales**
- Mostrar repuestos disponibles relacionados (fetch `/api/v1/public/repuestos`)
- Checkboxes multi-selección
- Botón "Siguiente" (puede skipear si no selecciona ninguno)

**Paso 3 — Datos del cliente**
- Nombre completo
- Email
- Teléfono
- Validación inline con React Hook Form + Zod (schema de `lib/validations.ts`)

**Paso 4 — Dirección y ciudad**
- Dirección (texto libre)
- Selector de ciudad (fetch `/api/v1/public/ciudades` — solo habilitadas)

**Paso 5 — Fecha y hora**
- Date picker (solo fechas futuras, deshabilitar fins de semana)
- Selector de hora (fetch `/api/v1/public/disponibilidad?ciudad_id=&fecha=` — slots disponibles)
- Resumen de la selección completa
- Botón "Confirmar"

**Paso 6 — Confirmación**
- Estado de carga mientras se envía POST a `/api/v1/public/citas`
- Respuesta exitosa: mensaje de confirmación con detalles
- Respuesta emergencia: mensaje de "serás contactado pronto"
- Respuesta error: mensaje de error específico

El estado del formulario multi-paso se gestiona con Zustand (`store/agendamiento.ts`) creado en TASK-01.

```tsx
'use client'

import { useState } from 'react'
import { useAgendamientoStore } from '@/store/agendamiento'
import { PasoServicio } from '@/components/public/agendamiento/PasoServicio'
import { PasoRepuestos } from '@/components/public/agendamiento/PasoRepuestos'
import { PasoCliente } from '@/components/public/agendamiento/PasoCliente'
import { PasoDireccion } from '@/components/public/agendamiento/PasoDireccion'
import { PasoFechaHora } from '@/components/public/agendamiento/PasoFechaHora'
import { PasoConfirmacion } from '@/components/public/agendamiento/PasoConfirmacion'

const PASOS = [
  'Servicio',
  'Repuestos',
  'Datos',
  'Dirección',
  'Fecha y hora',
  'Confirmación',
]

export default function AgendarPage() {
  const { paso, setPaso } = useAgendamientoStore()
  const [enviado, setEnviado] = useState(false)
  const [respuesta, setRespuesta] = useState<any>(null)

  const avanzar = () => setPaso(paso + 1)
  const retroceder = () => setPaso(paso - 1)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Indicador de pasos */}
        <div className="flex items-center justify-between mb-8">
          {PASOS.map((nombre, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= paso
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < paso ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del paso */}
        <div className="bg-white rounded-lg shadow p-6">
          {paso === 0 && <PasoServicio onNext={avanzar} />}
          {paso === 1 && <PasoRepuestos onNext={avanzar} onBack={retroceder} />}
          {paso === 2 && <PasoCliente onNext={avanzar} onBack={retroceder} />}
          {paso === 3 && <PasoDireccion onNext={avanzar} onBack={retroceder} />}
          {paso === 4 && <PasoFechaHora onNext={avanzar} onBack={retroceder} />}
          {paso === 5 && (
            <PasoConfirmacion
              onBack={retroceder}
              onEnviado={(resp) => {
                setEnviado(true)
                setRespuesta(resp)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 8. Store de agendamiento `store/agendamiento.ts`

```typescript
import { create } from 'zustand'

interface AgendamientoState {
  paso: number
  setPaso: (paso: number) => void
  servicioId: string | null
  setServicioId: (id: string) => void
  repuestoIds: string[]
  setRepuestoIds: (ids: string[]) => void
  cliente: {
    nombre: string
    email: string
    telefono: string
  }
  setCliente: (cliente: AgendamientoState['cliente']) => void
  direccion: string
  setDireccion: (d: string) => void
  ciudadId: string | null
  setCiudadId: (id: string) => void
  fechaHora: string | null
  setFechaHora: (fh: string) => void
  reset: () => void
}

const initial = {
  paso: 0,
  servicioId: null,
  repuestoIds: [],
  cliente: { nombre: '', email: '', telefono: '' },
  direccion: '',
  ciudadId: null,
  fechaHora: null,
}

export const useAgendamientoStore = create<AgendamientoState>((set) => ({
  ...initial,
  setPaso: (paso) => set({ paso }),
  setServicioId: (id) => set({ servicioId: id }),
  setRepuestoIds: (ids) => set({ repuestoIds: ids }),
  setCliente: (cliente) => set({ cliente }),
  setDireccion: (d) => set({ direccion: d }),
  setCiudadId: (id) => set({ ciudadId: id }),
  setFechaHora: (fh) => set({ fechaHora: fh }),
  reset: () => set(initial),
}))
```

### 9. Componente Chat Flotante `components/public/ChatFlotante.tsx`

- Botón flotante en esquina inferior derecha (fixed)
- Al hacer click, abre un panel con:
  - Estado de disponibilidad ("Estamos disponibles ahora" o "Fuera de horario")
  - Formulario de contacto: nombre, email, mensaje
  - Horario de atención configurable desde backoffice (fetch `/api/v1/public/configuracion`)
- Cerrar con botón X

```tsx
'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function ChatFlotante() {
  const [abierto, setAbierto] = useState(false)
  const [disponible, setDisponible] = useState(false)

  useEffect(() => {
    fetch('/api/v1/public/configuracion')
      .then((r) => r.json())
      .then((data) => setDisponible(data.disponible))
  }, [])

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label="Abrir chat"
      >
        {abierto ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Panel */}
      {abierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-lg bg-white shadow-xl border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Contacto</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {disponible ? 'Disponible' : 'Fuera de horario'}
              </span>
            </div>
          </div>
          <form className="p-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="Tu nombre" required />
            <Input type="email" placeholder="Tu correo" required />
            <Textarea placeholder="¿En qué podemos ayudarte?" rows={3} required />
            <Button type="submit" className="w-full">
              Enviar
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
```

### 10. Dark mode toggle `components/public/DarkModeToggle.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = () => {
    setDark(!dark)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', String(!dark))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="fixed top-4 right-4 z-50"
      aria-label="Cambiar modo oscuro"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  )
}
```

Configurar Tailwind para dark mode:

```ts
// tailwind.config.ts
darkMode: 'class',
```

### 11. Accesibilidad — botón agrandar texto

En `app/(public)/layout.tsx`, agregar un botón que alterne una clase `text-lg` en el body o use CSS custom properties para el font-size base.

### 12. Redes sociales desde backoffice

En el `Footer.tsx`, hacer fetch a `/api/v1/public/redes-sociales` y renderizar los iconos/enlaces configurados desde el backoffice. Si no hay datos, no mostrar la sección.

### 13. Responsive checklist

- Mobile: 320px+ — catalog cards en 1 columna
- Tablet: 640px+ — catalog cards en 2 columnas
- Desktop: 1024px+ — catalog cards en 3 columnas
- Formulario multi-paso: full width en móvil, centrado en desktop
- Chat flotante: posicionado correctamente en todos los tamaños

### 14. Accesibilidad (WCAG 2.1 AA)

- Contraste mínimo 4.5:1 para texto normal
- Labels asociados a inputs (htmlFor)
- ARIA labels en botones iconos
- Focus visible en todos los elementos interactivos
- Alt text en imágenes
- semantic HTML (nav, main, section, footer)

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] Home carga con catálogo de servicios en cards
- [ ] Click en card abre popup con detalle del servicio y sub-productos
- [ ] Sección de reels YouTube con scroll vertical funcional
- [ ] Formulario de agendamiento tiene 5 pasos navegables (servicio → repuestos → datos → dirección → fecha/hora)
- [ ] Validación inline en cada paso antes de avanzar
- [ ] Selector de ciudad muestra solo ciudades habilitadas
- [ ] Selector de fecha/hora muestra solo slots disponibles de `/api/v1/public/disponibilidad`
- [ ] Confirmación muestra mensaje de éxito o de "serás contactado"
- [ ] Chat flotante abre panel con formulario y estado de horario de atención
- [ ] Dark mode toggle funciona y persiste en localStorage
- [ ] Botón agrandar texto funciona
- [ ] Footer muestra redes sociales desde `/api/v1/public/redes-sociales`
- [ ] Todo el sitio es responsive desde 320px
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-01 (UI base, Zustand store), TASK-05 (API endpoints públicos)
- Bloquea: TASK-17 (SEO) — necesita el sitio público completo para agregar meta tags y sitemap

---

## Notas para el ejecutor

- Usar Server Components para las páginas (fetch en el server). Solo hacer 'use client' en los componentes que necesitan interactividad (formulario multi-paso, chat flotante, dark mode toggle)
- El catálogo y los reels son Server Components que hacen fetch directo
- shadcn/ui ya instalado en TASK-01 — usar sus componentes (Card, Dialog, Input, Button, etc.)
- Para los reels de YouTube, usar iframes con `loading="lazy"`. URL de ejemplo: `https://www.youtube.com/embed/VIDEO_ID`
- El fetch de disponibilidad en el paso 5 del formulario debe hacerse cada vez que cambie la fecha o la ciudad, usando `useEffect` en el componente del paso
- El estado del formulario multi-paso en Zustand (`store/agendamiento.ts`) permite navegar atrás sin perder datos

---

## Checklist de cierre

- [ ] Home con catálogo cards y popup de detalle
- [ ] Sección reels YouTube vertical
- [ ] Formulario 5 pasos funcional
- [ ] Chat flotante con estado de horario
- [ ] Dark mode + agrandar texto
- [ ] Redes sociales desde API
- [ ] Responsive 320px+
- [ ] `npm run build` exitoso

---

*Fin de TASK-09. Siguiente: TASK-10 — UI del backoffice Admin: Dashboard de métricas*