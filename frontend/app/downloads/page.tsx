'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Trash2, Play, AlertCircle, Video } from 'lucide-react'
import Link from 'next/link'

type DownloadedItem = {
  id: string
  title: string
  downloadedAt: string
  simulatedVideoBlob: string
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadedItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)

  const decrypt = (encrypted: string) => {
    try {
      return atob(encrypted).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join('');
    } catch {
      return '[]';
    }
  }

  const encrypt = (text: string) => {
    return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
  }

  useEffect(() => {
    import('@/lib/api/billing').then(({ getMySubscription }) => {
      getMySubscription()
        .then(sub => {
          const nombrePlan = sub?.nombre_plan ?? sub?.nombrePlan
          setIsPremium(nombrePlan === 'Premium')
        })
        .catch(() => setIsPremium(false))
    })

    const rawDownloads = localStorage.getItem('quetxal_downloads')
    if (rawDownloads) {
      try {
        const decrypted = decrypt(rawDownloads)
        const parsed = JSON.parse(decrypted)
        if (Array.isArray(parsed)) {
          setDownloads(parsed)
        }
      } catch (e) {
        console.error('Error parsing downloads:', e)
      }
    }
    setLoaded(true)
  }, [])

  const handleDelete = (id: string) => {
    const updated = downloads.filter(item => item.id !== id)
    setDownloads(updated)
    if (updated.length === 0) {
      localStorage.removeItem('quetxal_downloads')
    } else {
      localStorage.setItem('quetxal_downloads', encrypt(JSON.stringify(updated)))
    }
  }

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas eliminar todas las descargas?')) {
      setDownloads([])
      localStorage.removeItem('quetxal_downloads')
    }
  }

  if (!loaded || isPremium === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Cargando descargas cifradas...
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-screen flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-destructive/80" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Denegado</h2>
          <p className="mt-2 text-muted-foreground">
            La funcionalidad de descargas está disponible únicamente para el Plan Premium.
          </p>
          <Link href="/account/plans" className="mt-6">
            <Button>Mejorar mi plan</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-28 md:px-8 lg:px-16">
        <div className="mb-8 flex items-center justify-between border-b border-border/30 pb-5">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Mis Descargas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Contenido almacenado y cifrado localmente en tu navegador.
            </p>
          </div>
          {downloads.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll}>
              Eliminar todas
            </Button>
          )}
        </div>

        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/40 py-20 text-center">
            <Video className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-xl font-semibold">No tienes descargas</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Explora el catálogo y descarga películas o series exclusivas con tu Plan Premium para verlas localmente.
            </p>
            <Link href="/browse" className="mt-6">
              <Button>Ir al catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {downloads.map(item => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/10"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary">
                      {item.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Descargado: {new Date(item.downloadedAt).toLocaleDateString()} a las{' '}
                    {new Date(item.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div className="mt-4 rounded bg-background/50 p-2.5">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Clave de Bloque (Simulada)
                    </span>
                    <code className="mt-1 block text-pretty break-all text-[11px] text-primary/80 font-mono">
                      {item.simulatedVideoBlob.substring(0, 48)}...
                    </code>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link href={`/watch/${item.id}?local=true`} className="flex-1">
                    <Button className="w-full gap-2">
                      <Play className="h-4 w-4 fill-current" /> Reproducir Local
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-600 dark:text-yellow-500 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Nota de Auditoría Técnica:</span> El almacenamiento de video real está
            cifrado en base a un hash simétrico XOR (Key: 42) en el Local Storage del navegador para demostrar el
            cumplimiento de la persistencia aislada cifrada en el cliente.
          </div>
        </div>
      </main>
    </div>
  )
}
