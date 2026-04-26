import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: 'admin' | 'tecnico'
      nombre: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    rol: 'admin' | 'tecnico'
    nombre: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    rol: 'admin' | 'tecnico'
    nombre: string
  }
}