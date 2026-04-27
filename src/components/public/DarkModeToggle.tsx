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