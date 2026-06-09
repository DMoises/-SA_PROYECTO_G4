import { NextRequest, NextResponse } from 'next/server'
import { GATEWAY_URL, SESSION_COOKIE } from '@/lib/gateway'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ valido: false }, { status: 401 })
  }

  try {
    const gwRes = await fetch(`${GATEWAY_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!gwRes.ok) {
      return NextResponse.json({ valido: false }, { status: 401 })
    }

    const data = await gwRes.json().catch(() => ({} as any))
    return NextResponse.json({
      valido: true,
      usuario_id: data.usuario_id,
      rol: data.rol,
    })
  } catch (err) {
    console.error('Error validando sesion:', err)
    return NextResponse.json({ valido: false }, { status: 401 })
  }
}
