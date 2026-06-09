// Acceso al rating-service A TRAVES del API Gateway (patron BFF, server-side).
// La recomendacion (%) es publica; votar/ver-mi-voto requiere sesion: el BFF
// reenvia la cookie de sesion del navegador al gateway (que valida 'session')
// y resuelve el perfil activo desde /auth/profiles (primer perfil del usuario).
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

export interface Recomendacion {
  contenido_id: string
  total_votos: number
  votos_positivos: number
  porcentaje: number
}

export interface MiVoto {
  existe: boolean
  tipo: string
  valor: number
}

// Perfil activo: el primer perfil del usuario autenticado (el front aun no
// tiene selector de perfil). Devuelve null si no hay sesion valida.
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

export async function fetchRecomendacion(contenidoId: string): Promise<Recomendacion | null> {
  const r = await fetch(`${GATEWAY_URL}/ratings/${encodeURIComponent(contenidoId)}`, {
    cache: 'no-store',
  })
  if (!r.ok) return null
  return r.json()
}

export async function fetchMiVoto(
  cookie: string,
  perfilId: string,
  contenidoId: string,
): Promise<MiVoto | null> {
  const url = `${GATEWAY_URL}/ratings/${encodeURIComponent(contenidoId)}/usuario?perfil_id=${encodeURIComponent(perfilId)}`
  const r = await fetch(url, { cache: 'no-store', headers: { Cookie: cookie } })
  if (!r.ok) return null
  return r.json()
}

export async function votar(
  cookie: string,
  perfilId: string,
  contenidoId: string,
  tipo: string,
  valor: number,
): Promise<Recomendacion | null> {
  const r = await fetch(`${GATEWAY_URL}/ratings`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ perfil_id: perfilId, contenido_id: contenidoId, tipo, valor }),
  })
  if (!r.ok) return null
  return r.json()
}
