import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      requiresSetup?: boolean
    } & DefaultSession['user']
  }

  interface User {
    requiresSetup?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    requiresSetup?: boolean
  }
}
