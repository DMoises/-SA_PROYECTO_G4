import { NextRequest, NextResponse } from 'next/server'
import { fetchFicha } from '@/lib/catalog-gateway'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ perfilId: string }> }
) {
  const { perfilId } = await params

  try {
    const headers = new Headers()
    const cookie = request.headers.get('cookie')
    const authorization = request.headers.get('authorization')
    if (cookie) headers.set('cookie', cookie)
    if (authorization) headers.set('authorization', authorization)

    console.log(`BFF fetching history from gateway: ${GATEWAY_URL}/history/${perfilId}`)

    // 1. Fetch raw history from gateway
    const res = await fetch(`${GATEWAY_URL}/history/${perfilId}`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn(`Gateway history service returned error status: ${res.status}`)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: res.status })
    }

    const items = await res.json()
    if (!items || !Array.isArray(items)) {
      return NextResponse.json([])
    }

    // 2. Fetch catalog details for each content ID in parallel
    const richItems = await Promise.all(
      items.map(async (item) => {
        try {
          const content = await fetchFicha(item.contenido_id)
          if (!content) return null

          let subtext = ''
          let episodeTitle = ''
          
          if (item.tipo === 'serie' && item.temporada && item.episodio) {
            subtext = `T${item.temporada}:E${item.episodio}`
            // Find episode title from episodesList if it exists
            const ep = content.episodesList?.find(
              (e) => e.seasonNumber === item.temporada && e.episodeNumber === item.episodio
            )
            if (ep) {
              episodeTitle = ep.title
              subtext += ` - ${ep.title}`
            }
          } else {
            subtext = 'Película'
          }

          return {
            ...item,
            title: content.title,
            thumbnail: content.thumbnail,
            backdrop: content.backdrop,
            subtext,
            episodeTitle,
          }
        } catch (err) {
          console.error(`Error enriching history item ${item.contenido_id}:`, err)
          return null
        }
      })
    )

    // Filter out nulls
    const filteredItems = richItems.filter(Boolean)
    return NextResponse.json(filteredItems)
  } catch (error) {
    console.error('Error in custom history API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
