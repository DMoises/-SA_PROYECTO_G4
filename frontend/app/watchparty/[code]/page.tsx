'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import YouTube from 'react-youtube'
import { ArrowLeft, Copy, Check, Tv, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { validarSala } from '@/lib/api/watchparty'
import { Button } from '@/components/ui/button'

interface PlaybackVideo {
  contenidoId: string
  youtubeId: string
  videoUrl: string
  isVideoUrl: boolean
  nombre: string
  tipo: string
}

type EstadoAcceso = 'verificando' | 'permitido' | 'no-existe' | 'sin-sesion' | 'error'

export default function WatchPartyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const playerRef = useRef<any>(null)
  const isSyncing = useRef(false)
  const wsRef = useRef<WebSocket | null>(null)

  const [content, setContent] = useState<any>(null)
  const [video, setVideo] = useState<PlaybackVideo | null>(null)
  const [estadoAcceso, setEstadoAcceso] = useState<EstadoAcceso>('verificando')
  const [wsConnected, setWsConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  // 1. Validar la sala y cargar información del contenido
  useEffect(() => {
    async function init() {
      try {
        setEstadoAcceso('verificando')
        // Validar si la sala existe
        const resSala = await validarSala(code)
        if (!resSala.existe) {
          setEstadoAcceso('no-existe')
          return
        }

        const contenidoId = resSala.contenido_id

        // Obtener detalles del contenido para el título/info
        const resContent = await fetch(`/api/catalog/${contenidoId}`)
        if (resContent.ok) {
          const contentData = await resContent.json()
          setContent(contentData)
        }

        // Obtener video de reproducción (BFF de playback)
        const playbackHeaders: Record<string, string> = {}
        const storedProfile = localStorage.getItem('selectedProfile')
        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile)
            if (profile?.id) playbackHeaders['X-Profile-Id'] = profile.id
          } catch {}
        }

        const resPlayback = await fetch(`/api/playback/${contenidoId}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: playbackHeaders,
        })

        if (resPlayback.status === 401) {
          setEstadoAcceso('sin-sesion')
          return
        }

        if (!resPlayback.ok) {
          throw new Error('No se pudo cargar el video')
        }

        const videoData = await resPlayback.json()
        setVideo(videoData)
        setEstadoAcceso('permitido')
      } catch (err) {
        console.error('Error al inicializar Watch Party:', err)
        setEstadoAcceso('error')
      }
    }

    init()
  }, [code])

  // 2. Conectar al WebSocket de Watch Party
  useEffect(() => {
    if (estadoAcceso !== 'permitido' || !video) return

    // Construir URL del WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/watchparty/${code}`;

    console.log('Conectando a WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket de Watch Party conectado')
      setWsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log('Mensaje WebSocket recibido:', msg)

        // Marcar que estamos aplicando una sincronización externa
        isSyncing.current = true

        const player = playerRef.current
        if (!player) return

        const isHTML5 = video.isVideoUrl

        if (msg.action === 'play') {
          if (isHTML5) {
            player.currentTime = msg.time
            player.play().catch(() => {})
          } else {
            player.seekTo(msg.time, true)
            player.playVideo()
          }
        } else if (msg.action === 'pause') {
          if (isHTML5) {
            player.currentTime = msg.time
            player.pause()
          } else {
            player.seekTo(msg.time, true)
            player.pauseVideo()
          }
        } else if (msg.action === 'seek') {
          if (isHTML5) {
            player.currentTime = msg.time
          } else {
            player.seekTo(msg.time, true)
          }
        }

        // Liberar bloqueo de sincronización después de que termine la acción
        setTimeout(() => {
          isSyncing.current = false
        }, 600)
      } catch (err) {
        console.error('Error al procesar mensaje de WebSocket:', err)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket de Watch Party desconectado')
      setWsConnected(false)
    }

    ws.onerror = (err) => {
      console.error('Error en WebSocket de Watch Party:', err)
      setWsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [estadoAcceso, video, code])

  // 3. Emitir eventos locales de reproducción
  const emitPlay = (time: number) => {
    if (isSyncing.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    console.log('Emitiendo play en segundo:', time)
    wsRef.current.send(JSON.stringify({ action: 'play', time }))
  }

  const emitPause = (time: number) => {
    if (isSyncing.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    console.log('Emitiendo pause en segundo:', time)
    wsRef.current.send(JSON.stringify({ action: 'pause', time }))
  }

  const emitSeek = (time: number) => {
    if (isSyncing.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    console.log('Emitiendo seek en segundo:', time)
    wsRef.current.send(JSON.stringify({ action: 'seek', time }))
  }

  // 4. Handlers de los reproductores
  // YouTube player
  const onReady = (event: any) => {
    playerRef.current = event.target
    setPlayerReady(true)
  }

  const onStateChange = (event: any) => {
    const player = event.target
    const state = event.data
    const time = player.getCurrentTime()

    if (state === 1) { // PLAYING
      emitPlay(time)
    } else if (state === 2) { // PAUSED
      emitPause(time)
    }
  }

  // HTML5 native video player handlers
  const handleNativePlay = (e: any) => {
    emitPlay(e.currentTarget.currentTime)
  }

  const handleNativePause = (e: any) => {
    emitPause(e.currentTarget.currentTime)
  }

  const handleNativeSeeked = (e: any) => {
    emitSeek(e.currentTarget.currentTime)
  }

  // 5. Utilidades adicionales
  const copyInvitationLink = () => {
    const link = `${window.location.origin}/watchparty/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleForceSync = () => {
    const player = playerRef.current
    if (!player || !video) return
    const isHTML5 = video.isVideoUrl
    const currentTime = isHTML5 ? player.currentTime : player.getCurrentTime()
    emitSeek(currentTime)
  }

  if (estadoAcceso === 'verificando') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Tv className="mb-4 h-12 w-12 animate-pulse text-primary" />
        <p className="text-lg font-medium text-muted-foreground animate-pulse">Cargando Watch Party...</p>
      </div>
    )
  }

  if (estadoAcceso === 'no-existe') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Sala no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            El código de sala <span className="font-semibold text-primary">{code}</span> no existe o ha expirado.
          </p>
          <Link href="/browse">
            <Button size="lg">Ir a la cartelera</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (estadoAcceso === 'sin-sesion') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center border border-border bg-card/50 p-8 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Sesión Requerida</h1>
          <p className="text-muted-foreground mb-6">
            Debes iniciar sesión en Quetxal TV para unirte a esta sala de Watch Party.
          </p>
          <Button size="lg" className="w-full" onClick={() => router.push(`/login?redirect=/watchparty/${code}`)}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  if (estadoAcceso === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error de conexión</h1>
          <p className="text-muted-foreground mb-6">
            Ocurrió un problema al conectar con la sala. Verifica tu suscripción y tu conexión de red.
          </p>
          <Button size="lg" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Header */}
      <header className="px-4 py-4 md:px-8 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href={content ? `/browse/${content.id}` : '/browse'} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="font-semibold text-lg line-clamp-1">{content?.title || 'Watch Party'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-500 font-mono uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                Código: {code}
              </span>
              <span className="flex items-center gap-1 text-xs">
                {wsConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Desconectado</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSync}
            className="text-zinc-400 hover:text-white border border-zinc-800"
            title="Sincronizar a la fuerza con los demás participantes"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
          <Button
            size="sm"
            onClick={copyInvitationLink}
            className="bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </Button>
        </div>
      </header>

      {/* Main Player Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl aspect-video bg-zinc-950 rounded-xl overflow-hidden shadow-2xl relative border border-zinc-800 flex items-center justify-center">
          {video ? (
            video.isVideoUrl ? (
              <video
                key={video.videoUrl}
                src={video.videoUrl}
                controls
                autoPlay
                onPlay={handleNativePlay}
                onPause={handleNativePause}
                onSeeked={handleNativeSeeked}
                ref={(el) => {
                  playerRef.current = el
                  if (el && !playerReady) setPlayerReady(true)
                }}
                className="w-full h-full object-contain"
              />
            ) : (
              <YouTube
                videoId={video.youtubeId}
                onReady={onReady}
                onStateChange={onStateChange}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    playsinline: 1,
                    rel: 0,
                  },
                }}
                className="w-full h-full"
                iframeClassName="w-full h-full"
              />
            )
          ) : (
            <p className="text-zinc-500">Preparando video...</p>
          )}
        </div>

        {/* Instructions/Sleek Info Card */}
        <div className="mt-6 w-full max-w-5xl p-6 bg-zinc-950/50 border border-zinc-800/80 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-zinc-200">¡Estás en una Watch Party activa!</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Cualquier cambio en la reproducción (reproducir, pausar o buscar) se sincronizará automáticamente para todas las personas conectadas en esta sala.
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <span className="text-xs text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-center flex-1 md:flex-initial">
              Invita a tus amigos con el enlace o el código.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
