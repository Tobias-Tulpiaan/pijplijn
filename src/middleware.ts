import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth')
  const is2faRoute  = pathname.startsWith('/2fa')   || pathname.startsWith('/api/2fa')

  if (!isLoggedIn && !isAuthRoute && !is2faRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect naar 2FA setup als nog niet geconfigureerd
  if (isLoggedIn && req.auth?.user?.requiresSetup && !is2faRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL('/2fa/setup', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|sw.js|icons).*)'],
}
