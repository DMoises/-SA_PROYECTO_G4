import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

export async function GET() {
  try {
    const jar = await cookies()
    const token = jar.get('session')?.value
    const headers = token ? { Cookie: `session=${token}` } : {}
    const r = await fetch(`${GATEWAY_URL}/catalog/admin/categorias`, { headers, cache: 'no-store' })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ error: 'Error obteniendo categorias' }, { status: 502 })
  }
}
