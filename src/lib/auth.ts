import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { recordFailedAttempt, clearAttempts, isBlocked } from './login-attempts'
import type { User } from 'next-auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string

        const blocked = isBlocked(email)
        if (blocked.blocked) {
          throw new Error(`Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${blocked.remainingMinutes} minutos.`)
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.activo) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!passwordMatch) {
          const shouldBlock = recordFailedAttempt(email)
          if (shouldBlock) {
            const remaining = Math.ceil(15)
            throw new Error(`Tu cuenta está bloqueada temporalmente. Intenta nuevamente en ${remaining} minutos.`)
          }
          return null
        }

        clearAttempts(email)

        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as User).rol
        token.nombre = (user as User).nombre
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.rol = token.rol as 'admin' | 'tecnico'
        session.user.nombre = token.nombre as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
})