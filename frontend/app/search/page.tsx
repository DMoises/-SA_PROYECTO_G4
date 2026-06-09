'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, X, Play, Plus, ThumbsUp } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Content } from '@/lib/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Content[]>([])
  const [selectedGenre, setSelectedGenre] = useState('Todos')
  const [genres, setGenres] = useState<string[]>(['Todos'])

  // Generos disponibles, derivados de la cartelera real (via gateway).
  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then((items: Content[]) => {
        const all = Array.from(new Set((items || []).flatMap(c => c.genres))).sort()
        setGenres(['Todos', ...all])
      })
      .catch(() => {})
  }, [])

  // Busqueda/filtrado contra el catalogo real (via gateway: /api/catalog -> /catalog/buscar).
  useEffect(() => {
    const q = query.trim()
    if (!q && selectedGenre === 'Todos') {
      setResults([])
      return
    }
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (selectedGenre !== 'Todos') params.set('genero', selectedGenre)
    fetch(`/api/catalog?${params.toString()}`)
      .then(r => r.json())
      .then((items: Content[]) => setResults(Array.isArray(items) ? items : []))
      .catch(() => setResults([]))
  }, [query, selectedGenre])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="px-4 pt-24 md:px-8 lg:px-16">
        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Titulos, personas, generos"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-14 bg-input pl-12 pr-12 text-lg text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Genre Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => {
                setSelectedGenre(genre)
                setQuery('')
              }}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                selectedGenre === genre
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Results */}
        {query || selectedGenre !== 'Todos' ? (
          <>
            <h2 className="mb-6 text-xl font-semibold text-foreground">
              {query
                ? `Resultados para "${query}"`
                : `Contenido de ${selectedGenre}`}
              <span className="ml-2 text-muted-foreground">({results.length})</span>
            </h2>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.map(content => (
                  <SearchResultCard key={content.id} content={content} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  No encontramos resultados
                </h3>
                <p className="text-muted-foreground">
                  Intenta con otra busqueda o explora nuestras categorias
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Busca peliculas y series
            </h3>
            <p className="text-muted-foreground">
              Escribe un titulo, genero o nombre de actor para comenzar
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function SearchResultCard({ content }: { content: Content }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/browse/${content.id}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[2/3] overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105">
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
        </div>

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/60 to-transparent p-3 opacity-0 transition-opacity ${
            isHovered ? 'opacity-100' : ''
          }`}
        >
          <h3 className="mb-1 text-sm font-semibold text-foreground line-clamp-2">
            {content.title}
          </h3>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            {content.matchPercentage > 0 && (
              <span className="font-medium text-green-500">{content.matchPercentage}%</span>
            )}
            <span>{content.year}</span>
            <span>{content.type === 'movie' ? 'Pelicula' : 'Serie'}</span>
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
          </div>
        </div>
      </div>
    </Link>
  )
}
