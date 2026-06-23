import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Decodifica el payload del JWT (sin verificar firma — la verificación la hace el gateway).
function getRolFromSession(token: string): string {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded).rol ?? ''
  } catch {
    return ''
  }
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  const isProtectedPath =
    pathname.startsWith('/browse') ||
    pathname.startsWith('/profiles') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/watchparty')

  const isUserPath =
    pathname.startsWith('/browse') ||
    pathname.startsWith('/profiles') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/watchparty')

  const isAuthPath = pathname === '/login' || pathname === '/register'

  // Sin sesión → login
  if (isProtectedPath && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const rol = session ? getRolFromSession(session.value) : ''
  const isAdmin = rol === 'admin'

  // Admin que intenta navegar a páginas de usuario → redirigir al panel admin
  if (isUserPath && session && isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Usuario autenticado en login/register:
  // admin → panel admin, usuario normal → perfiles
  if (isAuthPath && session) {
    const url = request.nextUrl.clone()
    url.pathname = isAdmin ? '/admin' : '/profiles'
    return NextResponse.redirect(url)
  }

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
    '/admin/:path*',
    '/watchparty/:path*',
    '/login',
    '/register',
  ],
}
