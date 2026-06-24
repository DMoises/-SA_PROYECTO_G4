'use client'

import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import YouTube from 'react-youtube'
import {
  ArrowLeft,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react'
import {
  getResume,
  getHistory,
  saveProgress,
} from '@/lib/history'

interface PlaybackVideo {
  contenidoId: string
  youtubeId: string
  videoUrl: string
  isVideoUrl: boolean
  nombre: string
  tipo: string
}

type EstadoAcceso =
  | 'verificando'
  | 'permitido'
  | 'sin-suscripcion'
  | 'sin-sesion'
  | 'requiere-pin'
  | 'error'

function formatDuracion(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos <= 0) return ''
  const total = Math.floor(segundos)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const season = searchParams.get('season')
  const episode = searchParams.get('episode')

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

  const [duracionSegundos, setDuracionSegundos] =
    useState(0)

  // Control Parental: modal para capturar el PIN de 4 dígitos.
  const [mostrarModalPin, setMostrarModalPin] =
    useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [verificandoPin, setVerificandoPin] =
    useState(false)

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
   * Solicita la URL del video al BFF de reproducción.
   * - Siempre envía X-Profile-Id para que el Control Parental sepa qué perfil
   *   está reproduciendo.
   * - Si se pasa un PIN, lo envía en X-Parental-Pin para desbloquear contenido
   *   no apto en perfiles infantiles (reintento desde el modal).
   */
  const solicitarVideo = useCallback(
    async (pin?: string, signal?: AbortSignal) => {
      if (!perfilId) return

      const esReintentoConPin =
        typeof pin === 'string' && pin.length > 0

      if (esReintentoConPin) {
        setVerificandoPin(true)
        setPinError('')
      } else {
        setEstadoAcceso('verificando')
        setVideo(null)
      }

      try {
        let fetchUrl = `/api/playback/${encodeURIComponent(contenidoId)}`
        const queryParams = new URLSearchParams()
        if (season) queryParams.set('season', season)
        if (episode) queryParams.set('episode', episode)
        if (queryParams.toString()) {
          fetchUrl += `?${queryParams.toString()}`
        }

        const headers: Record<string, string> = {
          'X-Profile-Id': perfilId,
        }
        if (esReintentoConPin) {
          headers['X-Parental-Pin'] = pin as string
        }

        const respuesta = await fetch(fetchUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers,
          signal,
        })

        const data = await respuesta
          .json()
          .catch(() => null)

        if (respuesta.status === 401) {
          setEstadoAcceso('sin-sesion')
          setMostrarModalPin(false)
          return
        }

        if (respuesta.status === 403) {
          if (data?.code === 'PARENTAL_PIN_REQUIRED') {
            // Perfil infantil + contenido no apto: se requiere el PIN.
            setEstadoAcceso('requiere-pin')
            setMostrarModalPin(true)
            if (esReintentoConPin) {
              // El PIN enviado fue incorrecto.
              setPinError(
                data?.error ||
                  'PIN de Control Parental incorrecto. Inténtalo de nuevo.'
              )
            }
            return
          }

          setEstadoAcceso('sin-suscripcion')
          setMostrarModalPin(false)
          return
        }

        if (!respuesta.ok) {
          throw new Error(
            data?.error ||
              'No se pudo verificar el acceso'
          )
        }

        if (
          !data?.videoUrl ||
          !data?.contenidoId
        ) {
          throw new Error(
            'La respuesta de reproducción no es válida'
          )
        }

        if (!componenteMontadoRef.current) {
          return
        }

        // Acceso concedido (con o sin PIN): cerramos el modal y reproducimos.
        setVideo(data)
        setEstadoAcceso('permitido')
        setMostrarModalPin(false)
        setPinInput('')
        setPinError('')
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
          if (esReintentoConPin) {
            setPinError(
              'No se pudo verificar el PIN. Inténtalo de nuevo.'
            )
          } else {
            setEstadoAcceso('error')
          }
        }
      } finally {
        if (esReintentoConPin) {
          setVerificandoPin(false)
        }
      }
    },
    [contenidoId, perfilId, season, episode]
  )

  /*
   * Comprueba el acceso al montar y cuando cambia el contenido o el perfil.
   */
  useEffect(() => {
    if (!perfilCargado || !perfilId) {
      return
    }

    const controller = new AbortController()
    solicitarVideo(undefined, controller.signal)

    return () => {
      controller.abort()
    }
  }, [
    perfilCargado,
    perfilId,
    solicitarVideo,
  ])

  /*
   * Envía el PIN capturado en el modal y reintenta la reproducción.
   */
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(pinInput)) {
      setPinError('Ingresa los 4 dígitos del PIN.')
      return
    }
    solicitarVideo(pinInput)
  }

  /*
   * Reinicia el reproductor cuando cambia
   * el contenido.
   */
  useEffect(() => {
    progresoCargadoRef.current = false
    resumeProcesadoRef.current = false
    playerRef.current = null
    setPlayerReady(false)
  }, [contenidoId, video?.videoUrl, season, episode])

  /*
   * Recupera el progreso guardado.
   */
  /*
   * Recupera el progreso guardado para YouTube.
   */
  async function onReady(event: any) {
    const player = event.target

    playerRef.current = player
    setPlayerReady(true)

    try {
      const d =
        typeof player.getDuration === 'function'
          ? player.getDuration()
          : 0
      if (d > 0) setDuracionSegundos(d)
    } catch {
      /* la duración se actualizará luego en el intervalo de progreso */
    }

    if (
      !perfilId ||
      progresoCargadoRef.current
    ) {
      return
    }

    progresoCargadoRef.current = true

    try {
      console.log('Buscando progreso de YouTube:', {
        perfil_id: perfilId,
        contenido_id: contenidoId,
        season,
        episode,
      })

      let segundoGuardado = 0
      const historyItems = await getHistory(perfilId)
      if (Array.isArray(historyItems)) {
        const currentItem = historyItems.find(item => 
          item.contenido_id === contenidoId && 
          (item.tipo === 'pelicula' || 
           (item.temporada === (season ? parseInt(season) : null) && 
            item.episodio === (episode ? parseInt(episode) : null)))
        )
        if (currentItem) {
          segundoGuardado = Number(currentItem.segundo_exacto ?? 0)
        }
      }

      console.log(
        'Progreso YouTube recuperado:',
        segundoGuardado
      )

      if (
        !componenteMontadoRef.current ||
        playerRef.current !== player
      ) {
        progresoCargadoRef.current = false
        return
      }

      if (segundoGuardado <= 0) {
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
          `YouTube reanudado en el segundo ${segundoGuardado}`
        )
      } catch (error) {
        console.warn(
          'No se pudo mover YouTube al progreso guardado:',
          error
        )
      }
    } catch (error) {
      progresoCargadoRef.current = false

      console.error(
        'No se pudo recuperar el progreso de YouTube:',
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
   * Recupera el progreso guardado para Video Nativo (GCS/MP4).
   */
  async function handleNativeVideoReady(videoElement: HTMLVideoElement) {
    playerRef.current = videoElement
    setPlayerReady(true)

    if (
      Number.isFinite(videoElement.duration) &&
      videoElement.duration > 0
    ) {
      setDuracionSegundos(videoElement.duration)
    }

    if (
      !perfilId ||
      progresoCargadoRef.current
    ) {
      return
    }

    progresoCargadoRef.current = true

    try {
      console.log('Buscando progreso de Video Nativo:', {
        perfil_id: perfilId,
        contenido_id: contenidoId,
        season,
        episode,
      })

      let segundoGuardado = 0
      const historyItems = await getHistory(perfilId)
      if (Array.isArray(historyItems)) {
        const currentItem = historyItems.find(item => 
          item.contenido_id === contenidoId && 
          (item.tipo === 'pelicula' || 
           (item.temporada === (season ? parseInt(season) : null) && 
            item.episodio === (episode ? parseInt(episode) : null)))
        )
        if (currentItem) {
          segundoGuardado = Number(currentItem.segundo_exacto ?? 0)
        }
      }

      console.log(
        'Progreso Video Nativo recuperado:',
        segundoGuardado
      )

      if (
        !componenteMontadoRef.current ||
        playerRef.current !== videoElement
      ) {
        progresoCargadoRef.current = false
        return
      }

      if (segundoGuardado <= 0) {
        return
      }

      videoElement.currentTime = segundoGuardado
      console.log(`Video nativo reanudado en el segundo ${segundoGuardado}`)
    } catch (error) {
      progresoCargadoRef.current = false

      console.error(
        'No se pudo recuperar el progreso de Video Nativo:',
        error
      )
    } finally {
      if (
        componenteMontadoRef.current &&
        playerRef.current === videoElement
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
        const isHTML5 = video?.isVideoUrl
        const currentTime = Math.floor(
          isHTML5 ? player.currentTime : player.getCurrentTime()
        )

        const duration = Math.floor(
          isHTML5 ? player.duration : player.getDuration()
        )

        if (duration > 0) {
          setDuracionSegundos(duration)
        }

        if (
          !duration ||
          currentTime <= 0
        ) {
          return
        }

        await saveProgress({
          perfil_id: perfilId,
          contenido_id: contenidoId,
          tipo: (video?.tipo as 'pelicula' | 'serie') || 'pelicula',
          segundo_exacto: currentTime,
          duracion_total: duration,
          temporada: season ? parseInt(season) : undefined,
          episodio: episode ? parseInt(episode) : undefined,
        })

        console.log('Progreso guardado:', {
          contenido_id: contenidoId,
          tipo: video?.tipo,
          segundo_exacto: currentTime,
          duracion_total: duration,
          temporada: season,
          episodio: episode,
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
    video,
    season,
    episode,
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

      <h1 className="mb-2 text-2xl font-bold">
        {video ? `Reproduciendo: ${video.nombre}` : 'Reproduciendo contenido'}
      </h1>

      {duracionSegundos > 0 && (
        <p className="mb-5 text-sm text-white/60">
          Duración: {formatDuracion(duracionSegundos)}
        </p>
      )}

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
        estadoAcceso === 'requiere-pin' &&
        !mostrarModalPin && (
          <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-400" />

            <h2 className="text-xl font-semibold">
              Control Parental
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Este contenido no es apto para el perfil
              infantil. Introduce el PIN para
              reproducirlo.
            </p>

            <button
              onClick={() => {
                setPinError('')
                setMostrarModalPin(true)
              }}
              className="mt-5 inline-flex rounded-md bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Introducir PIN
            </button>
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
            {!playerReady && (
              <p className="mb-3 text-sm text-white/60">
                Preparando reproductor...
              </p>
            )}

            <div className="mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-black shadow-2xl">
              {video.isVideoUrl ? (
                <video
                  key={`${contenidoId}-${perfilId}-${video.videoUrl}`}
                  src={video.videoUrl}
                  controls
                  autoPlay
                  onPlay={(e) => {
                    const videoEl = e.currentTarget
                    handleNativeVideoReady(videoEl)
                  }}
                  onLoadedMetadata={(e) => {
                    const videoEl = e.currentTarget
                    handleNativeVideoReady(videoEl)
                  }}
                  onCanPlay={(e) => {
                    const videoEl = e.currentTarget
                    handleNativeVideoReady(videoEl)
                  }}
                  onError={() => {
                    setPlayerReady(true)
                    console.error('Error del reproductor de video nativo (GCS): No se pudo cargar el archivo de video')
                  }}
                  className="h-full w-full object-contain"
                />
              ) : (
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
                      autoplay: 1,
                      playsinline: 1,
                      rel: 0,
                    },
                  }}
                  className="h-full w-full"
                  iframeClassName="h-full w-full"
                />
              )}
            </div>
          </div>
        )}

      {/* Modal de Control Parental: solicita el PIN de 4 dígitos */}
      {mostrarModalPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">
                Control Parental
              </h2>
            </div>

            <p className="mb-5 text-sm text-white/60">
              Este contenido no es apto para el perfil
              infantil. Introduce el PIN de 4 dígitos
              para continuar.
            </p>

            <form
              onSubmit={handlePinSubmit}
              className="space-y-4"
            >
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={e =>
                  setPinInput(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4)
                  )
                }
                placeholder="••••"
                maxLength={4}
                className="w-full rounded-md border border-white/15 bg-black/40 px-4 py-3 text-center text-2xl tracking-[0.6em] text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              />

              {pinError && (
                <p className="text-sm text-red-400">
                  {pinError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalPin(false)
                    setPinInput('')
                    setPinError('')
                  }}
                  className="h-11 flex-1 rounded-md border border-white/15 text-sm font-medium text-white/80 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    verificandoPin ||
                    pinInput.length !== 4
                  }
                  className="h-11 flex-1 rounded-md bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {verificandoPin
                    ? 'Verificando...'
                    : 'Desbloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}