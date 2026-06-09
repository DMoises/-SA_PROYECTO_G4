import { Navbar } from '@/components/navbar'
import { HeroBanner } from '@/components/hero-banner'
import { ContentCarousel } from '@/components/content-carousel'
import { fetchCartelera, buscarContenido } from '@/lib/catalog-gateway'
import { Content } from '@/lib/types'

// El inicio muestra la CARTELERA REAL del catalogo (no mock). Server component
// que consulta el catalog-service a traves del gateway. Dinamico = datos frescos.
export const dynamic = 'force-dynamic'

export default async function BrowsePage() {
  // Cartelera completa + carruseles por categoria del catalogo.
  // ("Mi lista" y "Continuar viendo" NO se muestran: son lista/historial (RFS-06),
  //  otro dominio, sin backend en catalogo.)
  const [cartelera, tendencias, destacados] = await Promise.all([
    fetchCartelera().catch(() => [] as Content[]),
    buscarContenido(new URLSearchParams({ categoria: 'Tendencias' })).catch(() => [] as Content[]),
    buscarContenido(new URLSearchParams({ categoria: 'Destacados' })).catch(() => [] as Content[]),
  ])

  const movies = cartelera.filter(c => c.type === 'movie')
  const series = cartelera.filter(c => c.type === 'series')
  // "Nuevos lanzamientos" = estrenos del ultimo anio segun el ANIO del catalogo
  // (sin tocar la BD): anio >= anio_actual - 1.
  const anioActual = new Date().getFullYear()
  const nuevos = cartelera
    .filter(c => (c.year || 0) >= anioActual - 1)
    .sort((a, b) => (b.year || 0) - (a.year || 0))
  const featured = destacados[0] ?? cartelera[0] ?? null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {featured ? (
        <>
          {/* Hero Section (destacado del catalogo) */}
          <HeroBanner content={featured} />

          {/* Carruseles de la cartelera real */}
          <div className="-mt-32 relative z-10 space-y-8 pb-16">
            {tendencias.length > 0 && <ContentCarousel title="Tendencias" contents={tendencias} />}
            {nuevos.length > 0 && <ContentCarousel title="Nuevos lanzamientos" contents={nuevos} />}
            {movies.length > 0 && <ContentCarousel title="Peliculas" contents={movies} />}
            {series.length > 0 && <ContentCarousel title="Series" contents={series} />}
          </div>
        </>
      ) : (
        <div className="px-4 pt-32 pb-16 text-center md:px-8 lg:px-16">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">Catalogo no disponible</h1>
          <p className="text-muted-foreground">
            No se pudo cargar la cartelera en este momento. Intenta de nuevo mas tarde.
          </p>
        </div>
      )}

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
