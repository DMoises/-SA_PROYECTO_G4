'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react'
import { Content } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ContentCarouselProps {
  title: string
  contents: Content[]
}

export function ContentCarousel({ title, contents }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

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

  return (
    <div className="group/carousel relative py-4">
      <h2 className="mb-4 px-4 text-lg font-semibold text-foreground md:px-8 lg:px-16 lg:text-xl">
        {title}
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
          className="scrollbar-hide flex gap-2 overflow-x-auto px-4 md:px-8 lg:px-16"
        >
          {contents.map(content => (
            <ContentCard key={content.id} content={content} />
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

function ContentCard({ content }: { content: Content }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/browse/${content.id}`} className="block">
        <div
          className={cn(
            'relative aspect-[2/3] w-32 overflow-hidden rounded-md transition-transform duration-300 md:w-40 lg:w-48',
            isHovered && 'scale-105'
          )}
        >
          <img
            src={content.thumbnail}
            alt={content.title}
            className="h-full w-full object-cover"
          />

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {content.isNew && (
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Nuevo
              </span>
            )}
            {content.isTrending && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground">
                Top 10
              </span>
            )}
          </div>

          {/* Hover Overlay */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/60 to-transparent p-3 opacity-0 transition-opacity',
              isHovered && 'opacity-100'
            )}
          >
            <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">
              {content.title}
            </h3>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-green-500">{content.matchPercentage}% Match</span>
              <span>{content.rating}</span>
              <span>{content.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" className="h-7 w-7 rounded-full p-0">
                <Play className="h-3 w-3 fill-current" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 w-7 rounded-full border-muted-foreground/50 p-0">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 w-7 rounded-full border-muted-foreground/50 p-0">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="ml-auto h-7 w-7 rounded-full border-muted-foreground/50 p-0">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
