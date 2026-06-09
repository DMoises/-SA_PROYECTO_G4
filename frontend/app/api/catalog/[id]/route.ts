import { NextRequest, NextResponse } from 'next/server'
import { fetchFicha } from '@/lib/catalog-gateway'

// GET /api/catalog/{id} -> ficha tecnica (via gateway /catalog/contenido/{id})
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const ficha = await fetchFicha(id)
    if (!ficha) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 })
    }
    return NextResponse.json(ficha)
  } catch (err) {
    console.error('Error consultando la ficha:', err)
    return NextResponse.json({ error: 'Error consultando la ficha' }, { status: 502 })
  }
}
