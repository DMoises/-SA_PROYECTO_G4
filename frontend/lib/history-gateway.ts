const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

export async function getPerfilId(cookie: string): Promise<string | null> {
  if (!cookie) return null

  const r = await fetch(`${GATEWAY_URL}/auth/profiles`, {
    cache: 'no-store',
    headers: { Cookie: cookie },
  })

  if (!r.ok) return null

  const perfiles = await r.json()
  return Array.isArray(perfiles) && perfiles[0]?.id ? perfiles[0].id : null
}

export async function guardarProgreso(
  cookie: string,
  data: {
    perfil_id: string
    contenido_id: string
    tipo: 'pelicula' | 'serie'
    temporada?: number
    episodio?: number
    segundo_exacto: number
    duracion_total: number
  },
) {
  const r = await fetch(`${GATEWAY_URL}/history/progress`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(data),
  })

  if (!r.ok) return null
  return r.json()
}

export async function obtenerReanudacion(
  cookie: string,
  perfilId: string,
  contenidoId: string,
) {
  const r = await fetch(
    `${GATEWAY_URL}/history/${perfilId}/resume/${contenidoId}`,
    {
      cache: 'no-store',
      headers: { Cookie: cookie },
    },
  )

  if (!r.ok) return null
  return r.json()
}