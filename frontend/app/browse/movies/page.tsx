import { Navbar } from '@/components/navbar'
import { ContentCarousel } from '@/components/content-carousel'
import { getMovies, genres, getContentByGenre } from '@/lib/mock-data'

export default function MoviesPage() {
  const movies = getMovies()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full pt-16">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/movies-hero/1920/800"
            alt="Movies"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
        <div className="relative flex h-full flex-col justify-center px-4 md:px-8 lg:px-16">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Peliculas</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Descubre nuestra coleccion de peliculas. Desde clasicos hasta los ultimos estrenos.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="-mt-20 relative z-10 space-y-8 pb-16">
        <ContentCarousel title="Todas las peliculas" contents={movies} />
        <ContentCarousel title="Accion" contents={getContentByGenre('Accion').filter(c => c.type === 'movie')} />
        <ContentCarousel title="Comedia" contents={getContentByGenre('Comedia').filter(c => c.type === 'movie')} />
        <ContentCarousel title="Drama" contents={getContentByGenre('Drama').filter(c => c.type === 'movie')} />
        <ContentCarousel title="Terror" contents={getContentByGenre('Terror').filter(c => c.type === 'movie')} />
      </div>
    </div>
  )
}
