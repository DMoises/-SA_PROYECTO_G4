import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  const isProtectedPath = 
    pathname.startsWith('/browse') || 
    pathname.startsWith('/profiles') || 
    pathname.startsWith('/account')

  const isAuthPath = 
    pathname === '/login' || 
    pathname === '/register'

  // If user is trying to access a protected route without a session, redirect to login
  if (isProtectedPath && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access login/register, redirect to profiles
  if (isAuthPath && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/profiles'
    return NextResponse.redirect(url)
  }

  // Next.js client-side router sometimes caches pages. 
  // Let's add headers to prevent caching of protected routes for back/forward navigation.
  const response = NextResponse.next()
  
  if (isProtectedPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    '/browse/:path*',
    '/profiles/:path*',
    '/account/:path*',
    '/login',
    '/register'
  ]
}
