'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import YouTube from 'react-youtube'
import { ArrowLeft } from 'lucide-react'
import { getResume, saveProgress } from '@/lib/history'

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

  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [perfilCargado, setPerfilCargado] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  /*
   * Detecta si el componente continúa montado.
   * Evita usar el reproductor después de salir de la página
   * o después de un Fast Refresh.
   */
  useEffect(() => {
    componenteMontadoRef.current = true

    return () => {
      componenteMontadoRef.current = false
      playerRef.current = null
    }
  }, [])

  /*
   * Obtiene el perfil seleccionado desde localStorage.
   */
  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')

    if (!stored) {
      console.warn('No existe selectedProfile en localStorage')
      setPerfilCargado(true)
      return
    }

    try {
      const profile = JSON.parse(stored)

      if (!profile?.id) {
        console.warn('El perfil seleccionado no contiene un id')
        setPerfilCargado(true)
        return
      }

      setPerfilId(profile.id)

      console.log('Perfil seleccionado:', profile.id)
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
   * Reinicia las referencias cuando cambia el contenido.
   */
  useEffect(() => {
    progresoCargadoRef.current = false
    resumeProcesadoRef.current = false
    playerRef.current = null
    setPlayerReady(false)
  }, [contenidoId])

  /*
   * Recupera el progreso guardado cuando el reproductor
   * termina de cargar.
   */
  async function onReady(event: any) {
    const player = event.target

    playerRef.current = player
    setPlayerReady(true)

    if (!perfilId || progresoCargadoRef.current) return

    progresoCargadoRef.current = true

    try {
      console.log('Buscando progreso:', {
        perfil_id: perfilId,
        contenido_id: contenidoId,
      })

      const progreso = await getResume(
        perfilId,
        contenidoId
      )

      console.log('Progreso recuperado:', progreso)

      /*
       * getResume es asíncrono. Mientras esperamos, el
       * reproductor puede desmontarse o ser reemplazado.
       */
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

      if (segundoGuardado > 0) {
        try {
          /*
           * Comprobamos que el iframe siga existiendo
           * antes de llamar a seekTo.
           */
          const iframe =
            typeof player.getIframe === 'function'
              ? player.getIframe()
              : null

          if (!iframe || !iframe.isConnected) {
            console.warn(
              'El reproductor fue desmontado antes de reanudar'
            )

            progresoCargadoRef.current = false
            return
          }

          player.seekTo(segundoGuardado, true)

          console.log(
            `Video reanudado en el segundo ${segundoGuardado}`
          )
        } catch (error) {
          /*
           * Algunos errores internos de react-youtube pueden
           * ocurrir durante Fast Refresh. Los capturamos para
           * que Next.js no muestre la pantalla roja.
           */
          console.warn(
            'No se pudo mover el video al progreso guardado:',
            error
          )
        }
      } else {
        console.log(
          'No existe progreso anterior para este contenido'
        )
      }
    } catch (error) {
      progresoCargadoRef.current = false

      console.error(
        'No se pudo recuperar el progreso:',
        error
      )
    } finally {
      /*
       * Solo permitimos guardar si este sigue siendo
       * el reproductor actual.
       */
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
    if (!perfilId) return

    const interval = setInterval(async () => {
      const player = playerRef.current

      if (!player) return
      if (!componenteMontadoRef.current) return

      /*
       * Evita guardar desde el segundo 0 antes de haber
       * recuperado el progreso anterior.
       */
      if (!resumeProcesadoRef.current) return

      try {
        const currentTime = Math.floor(
          player.getCurrentTime()
        )

        const duration = Math.floor(
          player.getDuration()
        )

        if (!duration || currentTime <= 0) return

        await saveProgress({
          perfil_id: perfilId,
          contenido_id: contenidoId,
          tipo: 'pelicula',
          segundo_exacto: currentTime,
          duracion_total: duration,
        })

        console.log('Progreso guardado:', {
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
  }, [perfilId, contenidoId])

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <Link
        href={`/browse/${contenidoId}`}
        className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al detalle
      </Link>

      <h1 className="mb-4 text-2xl font-bold">
        Reproduciendo contenido
      </h1>

      {!perfilCargado && (
        <p className="text-sm text-white/60">
          Cargando perfil...
        </p>
      )}

      {perfilCargado && !perfilId && (
        <p className="text-sm text-white/60">
          No hay ningún perfil seleccionado.
        </p>
      )}

      {perfilCargado && perfilId && (
        <div>
          {!playerReady && (
            <p className="mb-3 text-sm text-white/60">
              Preparando reproductor...
            </p>
          )}

          <YouTube
            key={`${contenidoId}-${perfilId}`}
            videoId="dQw4w9WgXcQ"
            onReady={onReady}
            onError={(event) => {
              console.error(
                'Error del reproductor de YouTube:',
                event.data
              )
            }}
            opts={{
              width: '100%',
              height: '600',
              playerVars: {
                autoplay: 1,
              },
            }}
            className="w-full overflow-hidden rounded-lg"
            iframeClassName="w-full"
          />
        </div>
      )}
    </main>
  )
}