import { NextRequest, NextResponse } from 'next/server'
import { fetchCartelera, buscarContenido } from '@/lib/catalog-gateway'

// GET /api/catalog            -> cartelera completa
// GET /api/catalog?q=&genero= -> busqueda con filtros (via gateway /catalog/buscar)
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const titulo = sp.get('q') || sp.get('titulo') || ''
    const genero = sp.get('genero') || ''
    const categoria = sp.get('categoria') || ''
    const actor = sp.get('actor') || ''
    const tipo = sp.get('tipo') || ''

    if (titulo || genero || categoria || actor || tipo) {
      const params = new URLSearchParams()
      if (titulo) params.set('titulo', titulo)
      if (genero) params.set('genero', genero)
      if (categoria) params.set('categoria', categoria)
      if (actor) params.set('actor', actor)
      if (tipo) params.set('tipo', tipo)
      return NextResponse.json(await buscarContenido(params))
    }

    return NextResponse.json(await fetchCartelera())
  } catch (err) {
    console.error('Error consultando el catalogo:', err)
    return NextResponse.json({ error: 'Error consultando el catalogo' }, { status: 502 })
  }
}
