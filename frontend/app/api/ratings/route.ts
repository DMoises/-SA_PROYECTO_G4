import { NextRequest, NextResponse } from 'next/server'
import { getPerfilId, votar } from '@/lib/rating-gateway'

// POST /api/ratings  body: { contenido_id, tipo, valor }
// Requiere sesion (RFS-04.1). El perfil sale del primer perfil del usuario.
export async function POST(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? ''

  const perfilId = await getPerfilId(cookie)
  if (!perfilId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { contenido_id, tipo, valor } = body
  if (!contenido_id || !tipo) {
    return NextResponse.json({ error: 'contenido_id y tipo son obligatorios' }, { status: 400 })
  }

  const rec = await votar(cookie, perfilId, contenido_id, tipo, valor)
  if (!rec) {
    return NextResponse.json({ error: 'No se pudo registrar la calificacion' }, { status: 502 })
  }
  return NextResponse.json(rec)
}
