'use client'

import { useEffect } from 'react'

export function InicializarScheduler() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      import('@/lib/scheduler').then(({ iniciarScheduler }) => {
        iniciarScheduler()
      })
    }
  }, [])

  return null
}