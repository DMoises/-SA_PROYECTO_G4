'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  contenido_id: string
  tipo: 'pelicula' | 'serie'
  temporada: number | null
  episodio: number | null
  segundo_exacto: number
  duracion_total: number
  porcentaje_visto: number
  title: string
  thumbnail: string
  backdrop: string
  subtext: string
  episodeTitle: string
}

export function ContinueWatching() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')
    if (!stored) {
      setLoading(false)
      return
    }

    try {
      const profile = JSON.parse(stored)
      if (profile?.id) {
        fetchHistory(profile.id)
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  const fetchHistory = async (perfilId: string) => {
    try {
      const res = await fetch(`/api/history-bff/${encodeURIComponent(perfilId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setHistory(data)
        }
      }
    } catch (err) {
      console.error('Error fetching playback history:', err)
    } finally {
      setLoading(false)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    const newScrollLeft =
      direction === 'left'
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount

    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  if (loading || history.length === 0) {
    return null
  }

  return (
    <div className="group/carousel relative py-4">
      <h2 className="mb-4 px-4 text-lg font-semibold text-foreground md:px-8 lg:px-16 lg:text-xl">
        Continuar viendo
      </h2>

      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-0 z-10 flex h-full w-12 items-center justify-center bg-gradient-to-r from-background/80 to-transparent opacity-0 transition-opacity group-hover/carousel:opacity-100',
            !showLeftArrow && 'pointer-events-none opacity-0'
          )}
        >
          <ChevronLeft className="h-8 w-8 text-foreground" />
        </button>

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex gap-4 overflow-x-auto px-4 md:px-8 lg:px-16"
        >
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-0 z-10 flex h-full w-12 items-center justify-center bg-gradient-to-l from-background/80 to-transparent opacity-0 transition-opacity group-hover/carousel:opacity-100',
            !showRightArrow && 'pointer-events-none opacity-0'
          )}
        >
          <ChevronRight className="h-8 w-8 text-foreground" />
        </button>
      </div>
    </div>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const [isHovered, setIsHovered] = useState(false)

  const playUrl =
    item.tipo === 'serie' && item.temporada && item.episodio
      ? `/watch/${item.contenido_id}?season=${item.temporada}&episode=${item.episodio}`
      : `/watch/${item.contenido_id}`

  return (
    <div
      className="group relative flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={playUrl} className="block">
        <div
          className={cn(
            'relative aspect-video w-48 overflow-hidden rounded-md border border-border/10 bg-zinc-900 transition-transform duration-300 md:w-64 lg:w-72',
            isHovered && 'scale-105 border-border/40'
          )}
        >
          {/* Backdrop Image */}
          <img
            src={item.backdrop}
            alt={item.title}
            className="h-full w-full object-cover"
          />

          {/* Hover Play Button Overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200',
              isHovered && 'opacity-100'
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition hover:bg-white">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
          </div>

          {/* Text Info (Visible always/overlay) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-6">
            <h3 className="truncate text-xs font-semibold text-white md:text-sm">
              {item.title}
            </h3>
            <p className="truncate text-[10px] text-zinc-400 md:text-xs">
              {item.tipo === 'serie' ? (
                <>
                  Temporada {item.temporada}, Cap. {item.episodio}
                  {item.episodeTitle && ` - ${item.episodeTitle}`}
                </>
              ) : (
                'Película'
              )}
            </p>
            <p className="text-[9px] md:text-[10px] text-zinc-300 font-mono mt-0.5">
              {formatTime(item.segundo_exacto)} / {formatTime(item.duracion_total)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(item.porcentaje_visto, 100)}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '0:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const pad = (num: number) => num.toString().padStart(2, '0')

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`
  }
  return `${mins}:${pad(secs)}`
}

