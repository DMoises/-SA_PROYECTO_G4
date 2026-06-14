import { NextRequest, NextResponse } from 'next/server'
import { GATEWAY_URL } from '@/lib/gateway'

export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? ''

  try {
    const res = await fetch(`${GATEWAY_URL}/admin/audit-logs`, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
      },
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({ error: data.error || 'Acceso denegado o error de auditoria' }, { status: res.status })
    }

    const logs = await res.json()
    return NextResponse.json(logs)
  } catch (err) {
    console.error('Error al consultar logs de auditoria:', err)
    return NextResponse.json({ error: 'Error de red con el API Gateway' }, { status: 502 })
  }
}
