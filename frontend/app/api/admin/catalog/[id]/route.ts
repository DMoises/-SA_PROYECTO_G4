import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

async function authHeaders() {
  const jar = await cookies()
  const token = jar.get('session')?.value
  return token ? { Cookie: `session=${token}` } : {}
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/contenidos/${id}`, {
      headers: await authHeaders(),
      cache: 'no-store',
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error obteniendo contenido' }, { status: 502 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const body = await req.json()
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/contenidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error actualizando contenido' }, { status: 502 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/contenidos/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error eliminando contenido' }, { status: 502 })
  }
}
