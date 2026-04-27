# TASK-17 · Implementar SEO, performance y seguridad

> **Grupo funcional:** SEO / Performance / Infra
> **Referencia SDD:** § 8 (Requisitos no funcionales técnicos), § 1 (next.config.js security headers)
> **Referencia PRD:** RNF (SEO, performance LCP < 3s, accessibility WCAG 2.1 AA)

---

## Metadatos

| Campo | Valor |
|---|---|
| Funcionalidad | TASK-17 — SEO, performance y seguridad |
| Estimación | S (2–4 horas) |
| Prioridad | Media |
| Tipo | Frontend / Infra |
| Estado | Pendiente |
| Asignado a | [SIN ASIGNAR] |

---

## Contexto

Esta task cubre todo lo que hace el sitio más visible, rápido y seguro: meta tags y Open Graph, sitemap.xml y robots.txt, optimización de imágenes con `next/image`, headers de seguridad en next.config.js, y lazy loading de los reels de YouTube. No incluye cambios en la lógica de negocio.

---

## Lo que hay que hacer

### 1. Metadata API en Next.js 14 para las páginas públicas

Agregar `generateMetadata` en las páginas principales.

**`app/(public)/layout.tsx`** — metadata global del sitio:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Servicio Técnico de Electrodomésticos',
    template: '%s | Servicio Técnico',
  },
  description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos. Técnicos certificados, cobertura en todo Chile.',
  keywords: ['servicio técnico', 'electrodomésticos', 'mantenimiento', 'reparación', ' Chile'],
  authors: [{ name: 'Servicio Técnico' }],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Servicio Técnico',
    title: 'Servicio Técnico de Electrodomésticos',
    description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Servicio Técnico',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Servicio Técnico de Electrodomésticos',
    description: 'Agenda tu próxima visita de mantenimiento.',
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

**`app/(public)/page.tsx`** — metadata específica de la home:

```tsx
export const metadata: Metadata = {
  title: 'Servicio Técnico de Electrodomésticos',
  description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos. Técnicos certificados en tu ciudad.',
}

export default async function HomePage() {
  // ...
}
```

**`app/(public)/servicios/page.tsx`**:

```tsx
export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Catálogo completo de servicios de mantenimiento de electrodomésticos.',
}
```

**`app/(public)/agendar/page.tsx`**:

```tsx
export const metadata: Metadata = {
  title: 'Agendar cita',
  description: 'Agenda tu próxima visita de mantenimiento de electrodomésticos en minutos.',
}
```

### 2. sitemap.xml estático

Crear `app/sitemap.ts` o `app/sitemap.xml/route.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/servicios`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/repuestos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/agendar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]
}
```

### 3. robots.txt

Crear `app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/tecnico', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

### 4. Headers de seguridad en next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 5. Optimizar imágenes con next/image

Revisar todos los `<img>` del sitio público y reemplazarlos por `<Image />` de Next.js:

```tsx
import Image from 'next/image'

// Ejemplo en ServiceCard
<Image
  src="/service-placeholder.png"
  alt={servicio.nombre}
  width={400}
  height={300}
  className="w-full h-48 object-cover rounded-t-lg"
/>
```

Para las imágenes del catálogo de servicios, si no hay imágenes reales, usar un placeholder SVG genérico o un color sólido. La optimización de imágenes reales viene cuando el admin suba las imágenes.

### 6. Lazy loading de reels YouTube

Modificar el componente `ReelsYouTube.tsx` para que los iframes carguen lazy:

```tsx
export function ReelsYouTube({ videos }: { videos: string[] }) {
  return (
    <section className="py-12 max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-bold mb-8">Nuestros trabajos</h2>
      <div className="space-y-4 max-w-md mx-auto">
        {videos.map((videoUrl, i) => (
          <div key={i} className="aspect-[9/16] w-full max-w-sm mx-auto">
            <iframe
              src={videoUrl}
              loading="lazy"
              title={`Video ${i + 1}`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

### 7. Favicon y Open Graph image

Crear `public/favicon.ico` con el ícono del negocio (placeholder si no hay diseño).

Crear `public/og-image.png` — imagen de 1200x630 para Open Graph.

### 8. Verificar que todo compila

```bash
npm run build
```

---

## Criterio de aceptación

> La task está completa cuando:

- [ ] `metadata` exportada en las páginas públicas: `/`, `/servicios`, `/repuestos`, `/agendar`
- [ ] Open Graph tags presentes en el `<head>` de la home
- [ ] `app/sitemap.ts` genera `/sitemap.xml` accesible en producción
- [ ] `app/robots.ts` genera `/robots.txt` accesible en producción
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` en todas las responses
- [ ] Los iframes de YouTube usan `loading="lazy"`
- [ ] `next/image` disponible para optimizar imágenes (usado donde hay imágenes)
- [ ] `npm run build` pasa sin errores

---

## Dependencias

- Requiere: TASK-09 (UI del sitio público completa)
- No bloquea otras tasks

---

## Notas para el ejecutor

- El `Metadata` de Next.js 14 se exporta desde cada `page.tsx` y `layout.tsx`. No usar `<Head>` de react — está deprecado
- La imagen de Open Graph (`public/og-image.png`) necesita ser diseñada y agregada. Por ahora puede ser un placeholder
- Las keywords SEO específicas del PRD dicen "[PENDIENTE post-lanzamiento]" — no incluir keywords específicas ahora, solo las genéricas
- La `Permissions-Policy` deshabilita camera, microphone y geolocation por defecto — el sitio no usa ninguna de estas
- Los headers de seguridad van en `next.config.js` `headers()` async, no en un middleware separado

---

## Checklist de cierre

- [ ] Metadata en todas las páginas públicas
- [ ] sitemap.xml y robots.txt accesibles
- [ ] Headers de seguridad en next.config.js
- [ ] YouTube iframes con lazy loading
- [ ] next/image disponible para uso futuro
- [ ] `npm run build` exitoso

---

*Fin de TASK-17. Siguiente: TASK-18 — Script de backup con pg_dump + cron*