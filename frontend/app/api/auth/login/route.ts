import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/grpc/auth-client'

const TOKEN_COOKIE = 'qt_token'
const USERID_COOKIE = 'qt_user_id'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const result = await login({ email, password })

    const response = NextResponse.json({
      usuario_id: result.usuarioId,
      expira_en: result.expiraEn,
    })

    // Guardar token en cookie httpOnly (segura, no accesible desde JS del cliente)
    const maxAge = result.expiraEn - Math.floor(Date.now() / 1000)

    response.cookies.set(TOKEN_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge > 0 ? maxAge : 3600,
    })

    response.cookies.set(USERID_COOKIE, result.usuarioId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge > 0 ? maxAge : 3600,
    })

    return response
  } catch (err: any) {
    const code = err?.code
    // gRPC code 16 = Unauthenticated
    if (code === 16) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      )
    }
    console.error('Error en login:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
