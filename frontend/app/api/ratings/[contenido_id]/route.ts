import { NextRequest, NextResponse } from 'next/server'
import { fetchRecomendacion, fetchMiVoto, getPerfilId } from '@/lib/rating-gateway'

// GET /api/ratings/{contenido_id} -> { recomendacion, miVoto }
// recomendacion es publica; miVoto solo si hay sesion.
export async function GET(request: NextRequest, { params }: { params: Promise<{ contenido_id: string }> }) {
  const { contenido_id } = await params
  const cookie = request.headers.get('cookie') ?? ''

  const recomendacion = await fetchRecomendacion(contenido_id)

  let miVoto = null
  const perfilId = await getPerfilId(cookie)
  if (perfilId) {
    miVoto = await fetchMiVoto(cookie, perfilId, contenido_id)
  }

  return NextResponse.json({ recomendacion, miVoto })
}
