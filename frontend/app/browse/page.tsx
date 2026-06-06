import { Navbar } from '@/components/navbar'
import { HeroBanner } from '@/components/hero-banner'
import { ContentCarousel } from '@/components/content-carousel'
import { mockContent, getTrendingContent, getNewContent, getMovies, getSeries } from '@/lib/mock-data'

export default function BrowsePage() {
  const featuredContent = mockContent[0]
  const trending = getTrendingContent()
  const newReleases = getNewContent()
  const movies = getMovies()
  const series = getSeries()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroBanner content={featuredContent} />

      {/* Content Carousels */}
      <div className="-mt-32 relative z-10 space-y-8 pb-16">
        <ContentCarousel title="Tendencias" contents={trending} />
        <ContentCarousel title="Nuevos lanzamientos" contents={newReleases} />
        <ContentCarousel title="Peliculas populares" contents={movies} />
        <ContentCarousel title="Series populares" contents={series} />
        <ContentCarousel title="Mi lista" contents={mockContent.slice(0, 6)} />
        <ContentCarousel title="Continuar viendo" contents={mockContent.slice(3, 8)} />
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-xl font-bold text-primary">QUETXAL</span>
            <span className="text-xl font-light text-foreground">TV</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
            <a href="#" className="hover:underline">Audio y subtitulos</a>
            <a href="#" className="hover:underline">Centro de ayuda</a>
            <a href="#" className="hover:underline">Tarjetas de regalo</a>
            <a href="#" className="hover:underline">Prensa</a>
            <a href="#" className="hover:underline">Relaciones con inversionistas</a>
            <a href="#" className="hover:underline">Empleo</a>
            <a href="#" className="hover:underline">Terminos de uso</a>
            <a href="#" className="hover:underline">Privacidad</a>
            <a href="#" className="hover:underline">Avisos legales</a>
            <a href="#" className="hover:underline">Preferencias de cookies</a>
            <a href="#" className="hover:underline">Informacion corporativa</a>
            <a href="#" className="hover:underline">Contactanos</a>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © 2024 Quetxal TV. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
