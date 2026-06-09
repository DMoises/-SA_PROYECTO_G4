import { NextRequest, NextResponse } from 'next/server'
import { GATEWAY_URL, SESSION_COOKIE, extractSessionToken } from '@/lib/gateway'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 },
      )
    }

    const gwRes = await fetch(`${GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await gwRes.json().catch(() => ({} as any))

    if (!gwRes.ok) {
      return NextResponse.json(
        { error: data.error || 'Correo o contraseña incorrectos' },
        { status: gwRes.status },
      )
    }

    // El gateway pone el JWT en una cookie 'session'; la reemitimos como
    // cookie httpOnly del propio frontend.
    const token = extractSessionToken(gwRes)
    const response = NextResponse.json({
      usuario_id: data.usuario_id,
      expira_en: data.expira_en,
    })

    if (token) {
      const maxAge = Number(data.expira_en ?? 0) - Math.floor(Date.now() / 1000)
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAge > 0 ? maxAge : 3600,
      })
    }

    return response
  } catch (err) {
    console.error('Error en login:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
