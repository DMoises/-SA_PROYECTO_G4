import { NextRequest, NextResponse } from 'next/server'
import { fetchFicha } from '@/lib/catalog-gateway'

// GET /api/catalog/{id} -> ficha tecnica (via gateway /catalog/contenido/{id})
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Forward cookies and metadata headers to API Gateway (BFF pattern)
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  const auth = request.headers.get('authorization')
  const profileId = request.headers.get('x-profile-id')
  const parentalPin = request.headers.get('x-parental-pin')

  if (cookie) headers.set('cookie', cookie)
  if (auth) headers.set('authorization', auth)
  if (profileId) headers.set('x-profile-id', profileId)
  if (parentalPin) headers.set('x-parental-pin', parentalPin)

  try {
    const ficha = await fetchFicha(id, headers)
    if (!ficha) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 })
    }
    return NextResponse.json(ficha)
  } catch (err) {
    console.error('Error consultando la ficha:', err)
    return NextResponse.json({ error: 'Error consultando la ficha' }, { status: 502 })
  }
}
