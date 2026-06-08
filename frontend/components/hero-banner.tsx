'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, Info, VolumeX, Volume2 } from 'lucide-react'
import { Content } from '@/lib/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroBannerProps {
  content: Content
}

export function HeroBanner({ content }: HeroBannerProps) {
  const [muted, setMuted] = useState(true)

  return (
    <div className="relative h-[85vh] min-h-[600px] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={content.backdrop}
          alt={content.title}
          className="h-full w-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col justify-center px-4 md:px-8 lg:px-16">
        <div className="max-w-2xl">
          {/* Badges */}
          <div className="mb-4 flex items-center gap-3">
            {content.isNew && (
              <span className="rounded bg-primary px-2 py-1 text-xs font-bold uppercase text-primary-foreground">
                Nuevo
              </span>
            )}
            {content.isTrending && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">TOP 10</span>
                <span className="text-sm text-muted-foreground">en contenido hoy</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl text-balance">
            {content.title}
          </h1>

          {/* Meta Info */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-green-500">{content.matchPercentage}% para ti</span>
            <span>{content.year}</span>
            <span className="rounded border border-muted-foreground/50 px-1.5 py-0.5 text-xs">
              {content.rating}
            </span>
            {content.type === 'movie' ? (
              <span>{content.duration}</span>
            ) : (
              <span>{content.seasons} Temporada{content.seasons && content.seasons > 1 ? 's' : ''}</span>
            )}
            <span className="rounded border border-muted-foreground/50 px-1.5 py-0.5 text-xs">
              HD
            </span>
          </div>

          {/* Description */}
          <p className="mb-6 text-base text-foreground/90 line-clamp-3 md:text-lg text-pretty">
            {content.description}
          </p>

          {/* Genres */}
          <div className="mb-6 flex flex-wrap gap-2">
            {content.genres.map(genre => (
              <span key={genre} className="text-sm text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Play className="h-5 w-5 fill-current" />
              Reproducir
            </Button>
            <Link
              href={`/browse/${content.id}`}
              className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), "gap-2")}
            >
              <Info className="h-5 w-5" />
              Mas informacion
            </Link>
          </div>
        </div>
      </div>

      {/* Mute Button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-32 right-4 rounded-full border border-muted-foreground/50 p-2 text-foreground transition-colors hover:border-foreground md:right-8 lg:right-16"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {/* Age Rating */}
      <div className="absolute bottom-32 right-20 flex items-center gap-2 border-l-2 border-muted-foreground/50 bg-muted/50 px-4 py-1 md:right-24 lg:right-32">
        <span className="text-sm text-foreground">{content.rating}</span>
      </div>
    </div>
  )
}
