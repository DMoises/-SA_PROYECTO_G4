import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

async function authHeaders() {
  const jar = await cookies()
  const token = jar.get('session')?.value
  return token ? { Cookie: `session=${token}` } : {}
}

// GET /api/admin/catalog  -> lista todos los contenidos (incluyendo inactivos)
export async function GET() {
  try {
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/contenidos`, {
      headers: await authHeaders(),
      cache: 'no-store',
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error consultando catalogo admin' }, { status: 502 })
  }
}

// POST /api/admin/catalog  -> crear nuevo contenido
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/contenidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error creando contenido' }, { status: 502 })
  }
}
