// Acceso al catalog-service A TRAVES del API Gateway (patron BFF).
// Estas funciones corren del lado servidor (rutas app/api/catalog/*), por eso
// usan GATEWAY_URL y no se expone la topologia al navegador.
// Adapta la forma del catalogo (espanol) al tipo Content del front.
import { Content, Episode, CastMember } from './types'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'

// --- Formas que devuelve el gateway (/catalog/*) ---
interface ItemCartelera {
  contenido_id: string
  titulo: string
  tipo: string // 'pelicula' | 'serie'
  anio: number
  clasificacion: string
  generos: string // separado por coma
  categorias: string
  portada_url?: string
}
interface MiembroReparto {
  actor: string
  personaje: string
  rol: string
}
interface EpisodioApi {
  numero: number
  titulo: string
  duracion_min: number
}
interface TemporadaApi {
  numero: number
  episodios: EpisodioApi[]
}
interface FichaApi {
  contenido_id: string
  titulo: string
  tipo: string
  sinopsis: string
  anio: number
  clasificacion: string
  duracion_min: number
  generos: string
  categorias: string
  reparto: MiembroReparto[]
  temporadas: TemporadaApi[]
  portada_url?: string
}

// El catalogo no almacena imagenes; usamos placeholders deterministas por id.
const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/400/600`
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}/1920/1080`
const castPhoto = (seed: string) => `https://picsum.photos/seed/${seed}/200/300`

const splitGeneros = (s: string): string[] =>
  s ? s.split(',').map(x => x.trim()).filter(Boolean) : []

const mapTipo = (t: string): 'movie' | 'series' => (t === 'serie' ? 'series' : 'movie')

export function itemToContent(i: ItemCartelera): Content {
  return {
    id: i.contenido_id,
    title: i.titulo,
    type: mapTipo(i.tipo),
    thumbnail: i.portada_url || thumb(i.contenido_id),
    backdrop: i.portada_url || backdrop(i.contenido_id),
    year: i.anio,
    rating: i.clasificacion,
    genres: splitGeneros(i.generos),
    categories: splitGeneros(i.categorias),
    description: '',
    cast: [],
    // El porcentaje de recomendacion lo provee el rating-service, no el catalogo.
    matchPercentage: 0,
  }
}

// Content + la lista de episodios (que el tipo Content no incluye como arreglo).
export type ContentDetalle = Content & { episodesList: Episode[] }

export function fichaToContent(f: FichaApi): ContentDetalle {
  // proto3-JSON omite los arreglos vacios: una pelicula no trae 'temporadas'
  // y un contenido sin reparto no trae 'reparto'. Por eso default a [].
  const temporadas = f.temporadas ?? []
  const reparto = f.reparto ?? []
  const totalEpisodios = temporadas.reduce((n, t) => n + t.episodios.length, 0)
  const episodesList: Episode[] = temporadas.flatMap(t =>
    t.episodios.map(e => ({
      id: `${f.contenido_id}-t${t.numero}-e${e.numero}`,
      seriesId: f.contenido_id,
      seasonNumber: t.numero,
      episodeNumber: e.numero,
      title: e.titulo,
      description: '',
      duration: `${e.duracion_min}m`,
      thumbnail: thumb(`${f.contenido_id}-t${t.numero}-e${e.numero}`),
    })),
  )
  const cast: CastMember[] = reparto.map((r, idx) => ({
    id: `${f.contenido_id}-cast-${idx}`,
    name: r.actor,
    character: r.personaje,
    photo: castPhoto(`${f.contenido_id}-${idx}`),
  }))
  return {
    id: f.contenido_id,
    title: f.titulo,
    type: mapTipo(f.tipo),
    thumbnail: f.portada_url || thumb(f.contenido_id),
    backdrop: f.portada_url || backdrop(f.contenido_id),
    year: f.anio,
    rating: f.clasificacion,
    duration: f.tipo === 'pelicula' && f.duracion_min ? `${f.duracion_min}m` : undefined,
    seasons: temporadas.length || undefined,
    episodes: totalEpisodios || undefined,
    genres: splitGeneros(f.generos),
    categories: splitGeneros(f.categorias),
    description: f.sinopsis || '',
    cast,
    matchPercentage: 0,
    episodesList,
  }
}

// --- Llamadas al gateway (server-side) ---
export async function fetchCartelera(): Promise<Content[]> {
  const r = await fetch(`${GATEWAY_URL}/catalog/cartelera`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`gateway ${r.status}`)
  const items: ItemCartelera[] = await r.json()
  return (items || []).map(itemToContent)
}

export async function buscarContenido(params: URLSearchParams): Promise<Content[]> {
  const r = await fetch(`${GATEWAY_URL}/catalog/buscar?${params.toString()}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`gateway ${r.status}`)
  const items: ItemCartelera[] = await r.json()
  return (items || []).map(itemToContent)
}

export async function fetchFicha(id: string): Promise<ContentDetalle | null> {
  const r = await fetch(`${GATEWAY_URL}/catalog/contenido/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  })
  if (!r.ok) return null // 404 (no existe) o id malformado -> tratamos como no encontrado
  const f: FichaApi = await r.json()
  return fichaToContent(f)
}
