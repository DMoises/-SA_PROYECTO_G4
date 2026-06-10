import 'server-only'

export interface ContentVideo {
  youtubeId: string
  nombre: string
}

const VIDEOS_PRUEBA: ContentVideo[] = [
  {
    youtubeId: 'M7lc1UVf-VE',
    nombre: 'Video de prueba oficial',
  },
  {
    youtubeId: 'GjvgtwSOCao',
    nombre: 'Google I/O 2025 Developer Keynote',
  },
  {
    youtubeId: 'o8NiE3XMPrM',
    nombre: 'Google I/O 2025 Keynote',
  },
  {
    youtubeId: 'qBkyU1TJKDg',
    nombre: 'Google I/O 2022 Developer Keynote',
  },
  {
    youtubeId: 'cNfINi5CNbY',
    nombre: 'Google I/O 2023 Keynote',
  },
]

/*
 * Aquí puedes asociar IDs reales del catálogo
 * con videos específicos.
 */
const VIDEO_POR_CONTENIDO: Record<string, ContentVideo> = {
  // 'contenido-id-1': VIDEOS_PRUEBA[0],
  // 'contenido-id-2': VIDEOS_PRUEBA[1],
  // 'contenido-id-3': VIDEOS_PRUEBA[2],
}

function obtenerIndicePorContenido(
  contenidoId: string,
  totalVideos: number
): number {
  let hash = 0

  for (let i = 0; i < contenidoId.length; i += 1) {
    hash =
      (hash * 31 + contenidoId.charCodeAt(i)) >>> 0
  }

  return hash % totalVideos
}

export function getVideoForContent(
  contenidoId: string
): ContentVideo {
  const videoConfigurado =
    VIDEO_POR_CONTENIDO[contenidoId]

  if (videoConfigurado) {
    return videoConfigurado
  }

  const indice = obtenerIndicePorContenido(
    contenidoId,
    VIDEOS_PRUEBA.length
  )

  return VIDEOS_PRUEBA[indice]
}