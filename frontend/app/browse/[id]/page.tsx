'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Play, Plus, ThumbsUp, ThumbsDown, Share2, Download, Check, ChevronDown } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { ContentCarousel } from '@/components/content-carousel'
import { Button, buttonVariants } from '@/components/ui/button'
import { Content, Episode } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getResume } from '@/lib/history'

type ContentDetalle = Content & { episodesList?: Episode[] }

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [content, setContent] = useState<ContentDetalle | null>(null)
  const [related, setRelated] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [userRating, setUserRating] = useState<'up' | 'down' | null>(null)
  const [inMyList, setInMyList] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [resumeData, setResumeData] = useState<{
    temporada?: number
    episodio?: number
    segundo_exacto?: number
  } | null>(null)

  // Campos opcionales: proto3-JSON omite los que valen 0 (p. ej. porcentaje 0%).
  const [recomendacion, setRecomendacion] = useState<{
    total_votos?: number
    votos_positivos?: number
    porcentaje?: number
  } | null>(null)

  // Consultar el progreso de reproducción
  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')
    if (!stored) return

    try {
      const profile = JSON.parse(stored)
      if (profile?.id) {
        getResume(profile.id, id)
          .then(res => {
            if (res) {
              setResumeData({
                temporada: res.temporada,
                episodio: res.episodio,
                segundo_exacto: res.segundo_exacto,
              })
            }
          })
          .catch(err => console.error('Error fetching resume data:', err))
      }
    } catch {}
  }, [id])

  // Ficha tecnica real (via gateway: /api/catalog/{id} -> /catalog/contenido/{id}).
  useEffect(() => {
    setLoading(true)
    fetch(`/api/catalog/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then((c: ContentDetalle | null) => setContent(c))
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [id])

  // Relacionados: de la cartelera, los que comparten algun genero.
  useEffect(() => {
    if (!content) return
    fetch('/api/catalog')
      .then(r => r.json())
      .then((items: Content[]) =>
        setRelated(
          (items || [])
            .filter(c => c.id !== content.id && c.genres.some(g => content.genres.includes(g)))
            .slice(0, 10),
        ),
      )
      .catch(() => {})
  }, [content])

  // % de recomendacion (rating-service via gateway) + voto actual del usuario.
  useEffect(() => {
    fetch(`/api/ratings/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return
        setRecomendacion(data.recomendacion ?? null)
        if (data.miVoto?.existe && data.miVoto.tipo === 'pulgar') {
          setUserRating(data.miVoto.valor === 1 ? 'up' : 'down')
        }
      })
      .catch(() => {})
  }, [id])

  // Emite un pulgar (1 = arriba, 0 = abajo) por el gateway y actualiza el %.
  async function emitirVoto(valor: number) {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido_id: id, tipo: 'pulgar', valor }),
    })
    if (res.status === 401) {
      window.location.href = '/login'
      return
    }
    if (res.ok) {
      setRecomendacion(await res.json())
      setUserRating(valor === 1 ? 'up' : 'down')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pt-24 text-muted-foreground md:px-8 lg:px-16">Cargando...</div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pt-24 md:px-8 lg:px-16">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">Contenido no encontrado</h1>
          <p className="text-muted-foreground">El contenido que buscas no existe en el catalogo.</p>
        </div>
      </div>
    )
  }

  const episodes =
    content.type === 'series'
      ? (content.episodesList || []).filter(e => e.seasonNumber === selectedSeason)
      : []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] w-full">
        <div className="absolute inset-0">
          <img
            src={content.backdrop}
            alt={content.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        <div className="relative flex h-full flex-col justify-end px-4 pb-8 md:px-8 lg:px-16">
          <div className="max-w-3xl">
            {/* Badges */}
            <div className="mb-4 flex items-center gap-3">
              {content.isNew && (
                <span className="rounded bg-primary px-2 py-1 text-xs font-bold uppercase text-primary-foreground">
                  Nuevo
                </span>
              )}
              {content.isTrending && (
                <span className="rounded bg-secondary px-2 py-1 text-xs font-bold uppercase text-secondary-foreground">
                  Top 10
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl text-balance">
              {content.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              {recomendacion && (recomendacion.total_votos ?? 0) > 0 && (
                <span className="font-semibold text-green-500">
                  {Math.round(recomendacion.porcentaje ?? 0)}% recomendado ({recomendacion.total_votos ?? 0})
                </span>
              )}
              <span className="text-foreground">{content.year}</span>
              <span className="rounded border border-muted-foreground/50 px-1.5 py-0.5 text-xs text-foreground">
                {content.rating}
              </span>
              {content.type === 'movie' ? (
                <span className="text-foreground">{content.duration}</span>
              ) : (
                <span className="text-foreground">
                  {content.seasons} Temporada{content.seasons && content.seasons > 1 ? 's' : ''}
                </span>
              )}
              <span className="rounded border border-muted-foreground/50 px-1.5 py-0.5 text-xs text-foreground">
                HD
              </span>
              <span className="rounded border border-muted-foreground/50 px-1.5 py-0.5 text-xs text-foreground">
                5.1
              </span>
            </div>

            {/* Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href={
                  content.type === 'series'
                    ? (resumeData?.temporada && resumeData?.episodio
                      ? `/watch/${content.id}?season=${resumeData.temporada}&episode=${resumeData.episodio}`
                      : `/watch/${content.id}?season=1&episode=1`)
                    : `/watch/${content.id}`
                }
                className={cn(buttonVariants({ size: 'lg' }), 'gap-2 bg-foreground text-background hover:bg-foreground/90')}
              >
                <Play className="h-5 w-5 fill-current" />
                {resumeData ? 'Reanudar' : 'Reproducir'}
              </Link>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-12 rounded-full p-0"
                onClick={() => setInMyList(!inMyList)}
              >
                {inMyList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className={`h-12 w-12 rounded-full p-0 ${userRating === 'up' ? 'bg-green-500/20 text-green-500' : ''}`}
                onClick={() => emitirVoto(1)}
              >
                <ThumbsUp className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className={`h-12 w-12 rounded-full p-0 ${userRating === 'down' ? 'bg-red-500/20 text-red-500' : ''}`}
                onClick={() => emitirVoto(0)}
              >
                <ThumbsDown className="h-5 w-5" />
              </Button>
            </div>

            {/* Description */}
            <p className="mb-4 text-base text-foreground/90 md:text-lg text-pretty">
              {content.description}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {content.genres.map(genre => (
                <Link
                  key={genre}
                  href={`/search?genre=${genre}`}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Details */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Episodes (for series) */}
            {content.type === 'series' && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Episodios</h2>
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={e => setSelectedSeason(Number(e.target.value))}
                      className="appearance-none rounded bg-secondary px-4 py-2 pr-10 text-sm text-secondary-foreground"
                    >
                      {Array.from({ length: content.seasons || 1 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Temporada {i + 1}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-4">
                  {episodes.map(episode => (
                    <Link
                      key={episode.id}
                      href={`/watch/${content.id}?season=${episode.seasonNumber}&episode=${episode.episodeNumber}`}
                      className="group flex gap-4 rounded-lg bg-card p-4 transition-colors hover:bg-accent w-full text-left"
                    >
                      <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded md:w-40">
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="h-8 w-8 text-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            {episode.episodeNumber}. {episode.title}
                          </h3>
                          <span className="text-sm text-muted-foreground">{episode.duration}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {episode.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Cast */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Reparto</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {content.cast.map(member => (
                  <div key={member.id} className="text-center">
                    <div className="mx-auto mb-2 h-24 w-24 overflow-hidden rounded-full">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.character}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Informacion</h3>
              <dl className="space-y-3 text-sm">
                {content.director && (
                  <div>
                    <dt className="text-muted-foreground">Director</dt>
                    <dd className="text-foreground">{content.director}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Generos</dt>
                  <dd className="text-foreground">{content.genres.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Clasificacion</dt>
                  <dd className="text-foreground">{content.rating}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ano</dt>
                  <dd className="text-foreground">{content.year}</dd>
                </div>
                {content.type === 'series' && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Temporadas</dt>
                      <dd className="text-foreground">{content.seasons}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Episodios</dt>
                      <dd className="text-foreground">{content.episodes}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Actions Card */}
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Acciones</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Content */}
      {related.length > 0 && (
        <div className="pb-16">
          <ContentCarousel title="Titulos similares" contents={related} />
        </div>
      )}
    </div>
  )
}
