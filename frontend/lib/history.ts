const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function saveProgress(data: {
  perfil_id: string
  contenido_id: string
  tipo: 'pelicula' | 'serie'
  temporada?: number
  episodio?: number
  segundo_exacto: number
  duracion_total: number
}) {
  const res = await fetch(`${API_URL}/history/progress`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('No se pudo guardar el progreso')
  return res.json()
}

export async function getResume(perfilId: string, contenidoId: string) {
  const res = await fetch(`${API_URL}/history/${perfilId}/resume/${contenidoId}`, {
    credentials: 'include',
  })

  if (!res.ok) return null
  return res.json()
}

export async function getHistory(perfilId: string) {
  const res = await fetch(`${API_URL}/history/${perfilId}`, {
    credentials: 'include',
  })

  if (!res.ok) throw new Error('No se pudo obtener el historial')
  return res.json()
}