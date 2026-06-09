import { NextRequest, NextResponse } from 'next/server'
import { GATEWAY_URL } from '@/lib/gateway'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre_perfil } = await request.json()

    if (!email || !password || !nombre_perfil) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre de perfil son obligatorios' },
        { status: 400 },
      )
    }

    const gwRes = await fetch(`${GATEWAY_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre_perfil }),
    })
    const data = await gwRes.json().catch(() => ({} as any))

    if (!gwRes.ok) {
      return NextResponse.json(
        { error: data.error || 'No se pudo registrar' },
        { status: gwRes.status },
      )
    }

    return NextResponse.json(
      { usuario_id: data.usuario_id, perfil_id: data.perfil_id },
      { status: 201 },
    )
  } catch (err) {
    console.error('Error en registro:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
