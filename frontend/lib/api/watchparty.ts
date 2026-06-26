const API_URL = '/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: 'Error desconocido',
    }))
    throw new Error(error.error || 'Error en la petición')
  }

  return res.json()
}

export function crearSala(contenidoId: string) {
  return request('/watchparty/rooms', {
    method: 'POST',
    body: JSON.stringify({ contenido_id: contenidoId }),
  })
}

export function validarSala(code: string) {
  return request(`/watchparty/rooms/${code}`)
}
