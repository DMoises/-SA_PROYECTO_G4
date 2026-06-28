import { NextRequest, NextResponse } from 'next/server'
import { itemToContent } from '@/lib/catalog-gateway'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

// GET /api/catalog/recommendations?perfil_id=X
// BFF route: fetches personalized recommendations from gateway -> catalog-service
export async function GET(request: NextRequest) {
  const perfilId = request.nextUrl.searchParams.get('perfil_id')
  if (!perfilId) {
    return NextResponse.json({ error: 'perfil_id es obligatorio' }, { status: 400 })
  }

  // Forward auth headers (cookie/authorization) to the gateway
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (cookie) headers.set('cookie', cookie)
  if (authorization) headers.set('authorization', authorization)

  try {
    const res = await fetch(
      `${GATEWAY_URL}/catalog/recomendados?perfil_id=${encodeURIComponent(perfilId)}`,
      { headers, cache: 'no-store' }
    )

    if (!res.ok) {
      console.warn(`Gateway recommendations returned ${res.status}`)
      return NextResponse.json([], { status: res.status })
    }

    const items = await res.json()
    if (!items || !Array.isArray(items)) {
      return NextResponse.json([])
    }

    // Map gateway format (Spanish) to frontend Content type
    const contents = items.map(itemToContent)
    return NextResponse.json(contents)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json([], { status: 502 })
  }
}
