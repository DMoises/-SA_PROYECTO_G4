import { NextRequest, NextResponse } from 'next/server'
import { GATEWAY_URL, SESSION_COOKIE } from '@/lib/gateway'


function aPerfilUI(p: any) {
  return {
    id: p.id,
    nombre: p.nombre,
    esInfantil: p.es_infantil ?? p.esInfantil ?? false,
    idioma: p.idioma,
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const gwRes = await fetch(`${GATEWAY_URL}/auth/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!gwRes.ok) {
      return NextResponse.json({ error: 'No autorizado' }, { status: gwRes.status })
    }

    const data = await gwRes.json().catch(() => [])
    const perfiles = (Array.isArray(data) ? data : []).map(aPerfilUI)
    return NextResponse.json({ perfiles })
  } catch (err) {
    console.error('Error listando perfiles:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const { nombre, es_infantil = false, idioma = 'es' } = await request.json()
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del perfil es obligatorio' },
        { status: 400 },
      )
    }

    const gwRes = await fetch(`${GATEWAY_URL}/auth/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre, es_infantil, idioma }),
    })
    const data = await gwRes.json().catch(() => ({} as any))

    if (!gwRes.ok) {
      return NextResponse.json(
        { error: data.error || 'No se pudo crear el perfil' },
        { status: gwRes.status },
      )
    }

    return NextResponse.json(aPerfilUI(data), { status: 201 })
  } catch (err) {
    console.error('Error creando perfil:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
