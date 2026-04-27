'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Categoria {
  id: string
  nombre: string
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    fetch('/api/v1/admin/categorias')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategorias(data)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categorías</h1>
      </div>

      <div className="grid gap-4">
        {categorias.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <p className="font-semibold">{c.nombre}</p>
            </CardContent>
          </Card>
        ))}
        {categorias.length === 0 && (
          <p className="text-gray-500">No hay categorías registradas.</p>
        )}
      </div>
    </div>
  )
}