'use client'

import {
  use,
  useEffect,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import YouTube from 'react-youtube'
import {
  ArrowLeft,
  LockKeyhole,
} from 'lucide-react'
import {
  getResume,
  saveProgress,
} from '@/lib/history'

interface PlaybackVideo {
  contenidoId: string
  youtubeId: string
  nombre: string
}

type EstadoAcceso =
  | 'verificando'
  | 'permitido'
  | 'sin-suscripcion'
  | 'sin-sesion'
  | 'error'

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const contenidoId = id

  const playerRef = useRef<any>(null)
  const progresoCargadoRef = useRef(false)
  const resumeProcesadoRef = useRef(false)
  const componenteMontadoRef = useRef(false)

  const [perfilId, setPerfilId] =
    useState<string | null>(null)

  const [perfilCargado, setPerfilCargado] =
    useState(false)

  const [playerReady, setPlayerReady] =
    useState(false)

  const [estadoAcceso, setEstadoAcceso] =
    useState<EstadoAcceso>('verificando')

  const [video, setVideo] =
    useState<PlaybackVideo | null>(null)

  /*
   * Detecta si el componente continúa montado.
   */
  useEffect(() => {
    componenteMontadoRef.current = true

    return () => {
      componenteMontadoRef.current = false
      playerRef.current = null
    }
  }, [])

  /*
   * Obtiene el perfil seleccionado.
   */
  useEffect(() => {
    const stored = localStorage.getItem(
      'selectedProfile'
    )

    if (!stored) {
      console.warn(
        'No existe selectedProfile en localStorage'
      )

      setPerfilCargado(true)
      return
    }

    try {
      const profile = JSON.parse(stored)

      if (!profile?.id) {
        console.warn(
          'El perfil seleccionado no contiene un id'
        )

        setPerfilCargado(true)
        return
      }

      setPerfilId(profile.id)

      console.log(
        'Perfil seleccionado:',
        profile.id
      )
    } catch (error) {
      console.error(
        'No se pudo leer el perfil seleccionado:',
        error
      )
    } finally {
      setPerfilCargado(true)
    }
  }, [])

  /*
   * Comprueba la suscripción antes de obtener
   * el identificador del video.
   */
  useEffect(() => {
    if (!perfilCargado || !perfilId) {
      return
    }

    const controller = new AbortController()

    async function verificarAcceso() {
      setEstadoAcceso('verificando')
      setVideo(null)

      try {
        const respuesta = await fetch(
          `/api/playback/${encodeURIComponent(contenidoId)}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          }
        )

        const data = await respuesta
          .json()
          .catch(() => null)

        if (respuesta.status === 401) {
          setEstadoAcceso('sin-sesion')
          return
        }

        if (respuesta.status === 403) {
          setEstadoAcceso('sin-suscripcion')
          return
        }

        if (!respuesta.ok) {
          throw new Error(
            data?.error ||
              'No se pudo verificar el acceso'
          )
        }

        if (
          !data?.youtubeId ||
          !data?.contenidoId
        ) {
          throw new Error(
            'La respuesta de reproducción no es válida'
          )
        }

        if (!componenteMontadoRef.current) {
          return
        }

        setVideo(data)
        setEstadoAcceso('permitido')
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Error verificando acceso:',
          error
        )

        if (componenteMontadoRef.current) {
          setEstadoAcceso('error')
        }
      }
    }

    verificarAcceso()

    return () => {
      controller.abort()
    }
  }, [
    contenidoId,
    perfilCargado,
    perfilId,
  ])

  /*
   * Reinicia el reproductor cuando cambia
   * el contenido.
   */
  useEffect(() => {
    progresoCargadoRef.current = false
    resumeProcesadoRef.current = false
    playerRef.current = null
    setPlayerReady(false)
  }, [contenidoId, video?.youtubeId])

  /*
   * Recupera el progreso guardado.
   */
  async function onReady(event: any) {
    const player = event.target

    playerRef.current = player
    setPlayerReady(true)

    if (
      !perfilId ||
      progresoCargadoRef.current
    ) {
      return
    }

    progresoCargadoRef.current = true

    try {
      console.log('Buscando progreso:', {
        perfil_id: perfilId,
        contenido_id: contenidoId,
        youtube_video_id:
          video?.youtubeId,
      })

      const progreso = await getResume(
        perfilId,
        contenidoId
      )

      console.log(
        'Progreso recuperado:',
        progreso
      )

      if (
        !componenteMontadoRef.current ||
        playerRef.current !== player
      ) {
        progresoCargadoRef.current = false
        return
      }

      const segundoGuardado = Number(
        progreso?.segundo_exacto ?? 0
      )

      if (segundoGuardado <= 0) {
        console.log(
          'No existe progreso anterior para este contenido'
        )

        return
      }

      try {
        const iframe =
          typeof player.getIframe ===
          'function'
            ? player.getIframe()
            : null

        if (
          !iframe ||
          !iframe.isConnected
        ) {
          console.warn(
            'El reproductor fue desmontado antes de reanudar'
          )

          progresoCargadoRef.current = false
          return
        }

        player.seekTo(
          segundoGuardado,
          true
        )

        console.log(
          `Video reanudado en el segundo ${segundoGuardado}`
        )
      } catch (error) {
        console.warn(
          'No se pudo mover el video al progreso guardado:',
          error
        )
      }
    } catch (error) {
      progresoCargadoRef.current = false

      console.error(
        'No se pudo recuperar el progreso:',
        error
      )
    } finally {
      if (
        componenteMontadoRef.current &&
        playerRef.current === player
      ) {
        resumeProcesadoRef.current = true
      }
    }
  }

  /*
   * Guarda el progreso cada 10 segundos.
   */
  useEffect(() => {
    if (
      !perfilId ||
      estadoAcceso !== 'permitido'
    ) {
      return
    }

    const interval = setInterval(async () => {
      const player = playerRef.current

      if (!player) return
      if (!componenteMontadoRef.current) return
      if (!resumeProcesadoRef.current) return

      try {
        const currentTime = Math.floor(
          player.getCurrentTime()
        )

        const duration = Math.floor(
          player.getDuration()
        )

        if (
          !duration ||
          currentTime <= 0
        ) {
          return
        }

        await saveProgress({
          perfil_id: perfilId,
          contenido_id: contenidoId,
          tipo: 'pelicula',
          segundo_exacto: currentTime,
          duracion_total: duration,
        })

        console.log('Progreso guardado:', {
          contenido_id: contenidoId,
          segundo_exacto: currentTime,
          duracion_total: duration,
        })
      } catch (error) {
        console.error(
          'Error al guardar el progreso:',
          error
        )
      }
    }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [
    perfilId,
    contenidoId,
    estadoAcceso,
  ])

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <Link
        href={`/browse/${contenidoId}`}
        className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al detalle
      </Link>

      <h1 className="mb-5 text-2xl font-bold">
        Reproduciendo contenido
      </h1>

      {!perfilCargado && (
        <p className="text-sm text-white/60">
          Cargando perfil...
        </p>
      )}

      {perfilCargado && !perfilId && (
        <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-white/60" />

          <h2 className="text-xl font-semibold">
            Selecciona un perfil
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Necesitas seleccionar un perfil antes
            de reproducir contenido.
          </p>

          <Link
            href="/profiles"
            className="mt-5 inline-flex rounded-md bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Seleccionar perfil
          </Link>
        </div>
      )}

      {perfilCargado &&
        perfilId &&
        estadoAcceso ===
          'verificando' && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">
              Verificando suscripción...
            </p>
          </div>
        )}

      {perfilCargado &&
        perfilId &&
        estadoAcceso ===
          'sin-suscripcion' && (
          <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-white/60" />

            <h2 className="text-xl font-semibold">
              Suscripción requerida
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Necesitas una suscripción activa
              para reproducir este contenido.
            </p>

            <Link
              href="/account/plans"
              className="mt-5 inline-flex rounded-md bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Ver planes
            </Link>
          </div>
        )}

      {perfilCargado &&
        perfilId &&
        estadoAcceso ===
          'sin-sesion' && (
          <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-white/60" />

            <h2 className="text-xl font-semibold">
              Sesión requerida
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Inicia sesión para verificar tu
              suscripción.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-flex rounded-md bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

      {perfilCargado &&
        perfilId &&
        estadoAcceso === 'error' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-sm text-red-200">
              No se pudo verificar la
              suscripción. Intenta nuevamente.
            </p>
          </div>
        )}

      {perfilCargado &&
        perfilId &&
        estadoAcceso ===
          'permitido' &&
        video && (
          <div>
            <p className="mb-4 text-sm text-white/60">
              {video.nombre}
            </p>

            {!playerReady && (
              <p className="mb-3 text-sm text-white/60">
                Preparando reproductor...
              </p>
            )}

            <div className="mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-black shadow-2xl">
              <YouTube
                key={`${contenidoId}-${perfilId}-${video.youtubeId}`}
                videoId={video.youtubeId}
                onReady={onReady}
                onError={(event) => {
                  setPlayerReady(true)

                  console.error(
                    'Error del reproductor de YouTube:',
                    {
                      codigo: event.data,
                      contenido_id:
                        contenidoId,
                      video_id:
                        video.youtubeId,
                    }
                  )
                }}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 0,
                    playsinline: 1,
                    rel: 0,
                  },
                }}
                className="h-full w-full"
                iframeClassName="h-full w-full"
              />
            </div>
          </div>
        )}
    </main>
  )
}