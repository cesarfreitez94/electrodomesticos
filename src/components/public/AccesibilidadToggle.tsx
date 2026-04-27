'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Accessibility } from 'lucide-react'

export function AccesibilidadToggle() {
  const [large, setLarge] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('textLarge')
    if (saved === 'true') {
      setLarge(true)
      document.body.classList.add('text-lg')
    }
  }, [])

  const toggle = () => {
    setLarge(!large)
    document.body.classList.toggle('text-lg')
    localStorage.setItem('textLarge', String(!large))
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      className="fixed top-4 right-16 z-50"
      aria-label="Agrandar texto"
    >
      <Accessibility size={20} />
    </Button>
  )
}