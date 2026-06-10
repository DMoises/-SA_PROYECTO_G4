const HISTORY_API_URL = '/api/history'

async function obtenerMensajeError(
  response: Response,
  mensajePredeterminado: string
): Promise<string> {
  try {
    const data = await response.json()

    return (
      data.error ||
      data.message ||
      mensajePredeterminado
    )
  } catch {
    return mensajePredeterminado
  }
}

export async function saveProgress(data: {
  perfil_id: string
  contenido_id: string
  tipo: 'pelicula' | 'serie'
  temporada?: number
  episodio?: number
  segundo_exacto: number
  duracion_total: number
}) {
  const res = await fetch(
    `${HISTORY_API_URL}/progress`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  if (!res.ok) {
    const mensaje = await obtenerMensajeError(
      res,
      'No se pudo guardar el progreso'
    )

    throw new Error(`${mensaje} (${res.status})`)
  }

  return res.json()
}

export async function getResume(
  perfilId: string,
  contenidoId: string
) {
  const res = await fetch(
    `${HISTORY_API_URL}/${encodeURIComponent(perfilId)}/resume/${encodeURIComponent(contenidoId)}`,
    {
      credentials: 'include',
    }
  )

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    const mensaje = await obtenerMensajeError(
      res,
      'No se pudo recuperar el progreso'
    )

    throw new Error(`${mensaje} (${res.status})`)
  }

  return res.json()
}

export async function getHistory(
  perfilId: string
) {
  const res = await fetch(
    `${HISTORY_API_URL}/${encodeURIComponent(perfilId)}`,
    {
      credentials: 'include',
    }
  )

  if (!res.ok) {
    const mensaje = await obtenerMensajeError(
      res,
      'No se pudo obtener el historial'
    )

    throw new Error(`${mensaje} (${res.status})`)
  }

  return res.json()
}