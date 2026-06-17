import {
  NextRequest,
  NextResponse,
} from 'next/server'
import { getVideoForContent } from '@/lib/server/content-videos'
import { fetchFicha } from '@/lib/catalog-gateway'

const GATEWAY_URL =
  process.env.GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080'

interface Suscripcion {
  plan_id?: string
  planId?: string
  id_plan?: string

  activa?: boolean
  activo?: boolean
  is_active?: boolean

  estado?: string
  status?: string
  estado_suscripcion?: string

  fecha_fin?: string
  fechaFin?: string
  end_date?: string
  fecha_vencimiento?: string
}

function esObjeto(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor)
  )
}

function obtenerSuscripcion(
  data: unknown
): Suscripcion | null {
  if (!esObjeto(data)) {
    return null
  }

  const posiblesValores = [
    data.suscripcion,
    data.subscription,
    data.data,
    data,
  ]

  for (const valor of posiblesValores) {
    if (esObjeto(valor)) {
      return valor as Suscripcion
    }
  }

  return null
}

function fechaContinuaVigente(
  suscripcion: Suscripcion
): boolean {
  const fechaFin =
    suscripcion.fecha_fin ??
    suscripcion.fechaFin ??
    suscripcion.end_date ??
    suscripcion.fecha_vencimiento

  if (!fechaFin) {
    return true
  }

  const fechaExpiracion = new Date(fechaFin)

  if (
    Number.isNaN(
      fechaExpiracion.getTime()
    )
  ) {
    return true
  }

  return (
    fechaExpiracion.getTime() >= Date.now()
  )
}

function tieneSuscripcionActiva(
  data: unknown
): boolean {
  const suscripcion =
    obtenerSuscripcion(data)

  if (!suscripcion) {
    return false
  }

  /*
   * Primero verifica un valor booleano explícito.
   */
  const valorExplicito =
    suscripcion.activa ??
    suscripcion.activo ??
    suscripcion.is_active

  if (
    typeof valorExplicito === 'boolean'
  ) {
    return (
      valorExplicito &&
      fechaContinuaVigente(suscripcion)
    )
  }

  /*
   * Después verifica el estado textual.
   */
  const estado = String(
    suscripcion.estado ??
      suscripcion.status ??
      suscripcion.estado_suscripcion ??
      ''
  )
    .trim()
    .toLowerCase()

  const estadosInactivos = [
    'cancelada',
    'cancelado',
    'cancelled',
    'canceled',
    'inactiva',
    'inactivo',
    'inactive',
    'expirada',
    'expirado',
    'expired',
    'suspendida',
    'suspendido',
    'suspended',
  ]

  if (estadosInactivos.includes(estado)) {
    return false
  }

  const estadosActivos = [
    'activa',
    'activo',
    'active',
    'vigente',
    'paid',
    'pagada',
  ]

  if (estadosActivos.includes(estado)) {
    return fechaContinuaVigente(
      suscripcion
    )
  }

  /*
   * Tu frontend de planes reconoce la suscripción
   * mediante plan_id. Se usa como respaldo cuando
   * el backend no devuelve estado ni activa.
   */
  const planId =
    suscripcion.plan_id ??
    suscripcion.planId ??
    suscripcion.id_plan

  return (
    typeof planId === 'string' &&
    planId.trim().length > 0 &&
    fechaContinuaVigente(suscripcion)
  )
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const { id } = await params

  try {
    const headers = new Headers()

    const cookie =
      request.headers.get('cookie')

    const authorization =
      request.headers.get(
        'authorization'
      )

    if (cookie) {
      headers.set('cookie', cookie)
    }

    if (authorization) {
      headers.set(
        'authorization',
        authorization
      )
    }

    console.log(
      'Gateway usado para playback:',
      GATEWAY_URL
    )

    const respuestaSuscripcion =
      await fetch(
        `${GATEWAY_URL}/billing/subscriptions/me`,
        {
          method: 'GET',
          headers,
          cache: 'no-store',
        }
      )

    const textoRespuesta =
      await respuestaSuscripcion.text()

    let datosSuscripcion: unknown = null

    if (textoRespuesta) {
      try {
        datosSuscripcion =
          JSON.parse(textoRespuesta)
      } catch {
        datosSuscripcion = null
      }
    }

    console.log(
      'Respuesta de billing para playback:',
      {
        status:
          respuestaSuscripcion.status,
        datos: datosSuscripcion,
      }
    )

    if (
      respuestaSuscripcion.status === 401
    ) {
      return NextResponse.json(
        {
          error:
            'Debes iniciar sesión para reproducir contenido',
          code: 'UNAUTHORIZED',
        },
        {
          status: 401,
        }
      )
    }

    if (
      respuestaSuscripcion.status === 404
    ) {
      return NextResponse.json(
        {
          error:
            'No se encontró una suscripción para este usuario',
          code: 'SUBSCRIPTION_NOT_FOUND',
        },
        {
          status: 403,
        }
      )
    }

    if (!respuestaSuscripcion.ok) {
      console.error(
        'Error consultando la suscripción:',
        {
          status:
            respuestaSuscripcion.status,
          respuesta: textoRespuesta,
        }
      )

      return NextResponse.json(
        {
          error:
            'No se pudo verificar la suscripción',
          code:
            'SUBSCRIPTION_CHECK_FAILED',
        },
        {
          status: 502,
        }
      )
    }

    if (
      !tieneSuscripcionActiva(
        datosSuscripcion
      )
    ) {
      console.warn(
        'La suscripción no fue reconocida como activa:',
        datosSuscripcion
      )

      return NextResponse.json(
        {
          error:
            'Necesitas una suscripción activa para reproducir contenido',
          code:
            'SUBSCRIPTION_REQUIRED',
        },
        {
          status: 403,
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    let dbVideoUrl: string | null = null
    try {
      const adminUrl = process.env.CATALOG_ADMIN_URL || 
        ((process.env.GATEWAY_URL || '').includes('api-gateway') ? 'http://catalog-service:8086' : 'http://localhost:8086')
      
      let fetchUrl = `${adminUrl}/admin/videos/${id}`
      if (season && episode) {
        fetchUrl = `${adminUrl}/admin/videos/${id}/temporadas/${season}/episodios/${episode}`
      }
      
      console.log('Fetching video URL from:', fetchUrl)
      const adminRes = await fetch(fetchUrl, { cache: 'no-store' })
      if (adminRes.ok) {
        const adminData = await adminRes.json()
        dbVideoUrl = adminData.video_url
      }
    } catch (err) {
      console.warn('Could not fetch video URL from catalog-service admin:', err)
    }

    let videoUrl = dbVideoUrl || ''
    let isVideoUrl = false
    let youtubeId = ''

    if (videoUrl) {
      const isHttp = videoUrl.startsWith('http://') || videoUrl.startsWith('https://')
      const isYoutubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
      
      if (isHttp && !isYoutubeUrl) {
        isVideoUrl = true
      } else if (isYoutubeUrl) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
        const match = videoUrl.match(regExp)
        youtubeId = (match && match[2].length === 11) ? match[2] : videoUrl
      } else {
        youtubeId = videoUrl
      }
    }

    if (!videoUrl) {
      const fallback = getVideoForContent(id)
      youtubeId = fallback.youtubeId
      videoUrl = fallback.youtubeId
      isVideoUrl = false
    }

    let tipo = 'pelicula'
    let nombre = 'Reproduciendo contenido'
    try {
      const content = await fetchFicha(id)
      if (content) {
        tipo = content.type === 'series' ? 'serie' : 'pelicula'
        nombre = content.title
        if (season && episode) {
          nombre += ` - T${season}:E${episode}`
        }
      }
    } catch (err) {
      console.warn('Could not fetch metadata for playback response:', err)
    }

    return NextResponse.json({
      contenidoId: id,
      videoUrl: videoUrl,
      isVideoUrl: isVideoUrl,
      youtubeId: youtubeId,
      nombre: nombre,
      tipo: tipo,
    })
  } catch (error) {
    console.error(
      'Error verificando acceso al contenido:',
      error
    )

    return NextResponse.json(
      {
        error:
          'No se pudo verificar el acceso al contenido',
        code: 'PLAYBACK_ERROR',
      },
      {
        status: 502,
      }
    )
  }
}