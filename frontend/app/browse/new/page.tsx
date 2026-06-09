import { Navbar } from '@/components/navbar'
import { ContentCarousel } from '@/components/content-carousel'
import { fetchCartelera } from '@/lib/catalog-gateway'
import { Content } from '@/lib/types'

// Novedades = estrenos del ultimo anio segun el ANIO del catalogo (sin tocar BD):
// anio >= anio_actual - 1.
export const dynamic = 'force-dynamic'

export default async function NewPage() {
  const cartelera = await fetchCartelera().catch(() => [] as Content[])
  const anioActual = new Date().getFullYear()
  const nuevos = cartelera
    .filter(c => (c.year || 0) >= anioActual - 1)
    .sort((a, b) => (b.year || 0) - (a.year || 0))
  const pelis = nuevos.filter(c => c.type === 'movie')
  const series = nuevos.filter(c => c.type === 'series')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full pt-16">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/new-hero/1920/800"
            alt="Novedades"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
        <div className="relative flex h-full flex-col justify-center px-4 md:px-8 lg:px-16">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Novedades</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Los estrenos mas recientes del catalogo.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="-mt-20 relative z-10 space-y-8 pb-16">
        {nuevos.length > 0 ? (
          <>
            <ContentCarousel title="Estrenos recientes" contents={nuevos} />
            {pelis.length > 0 && <ContentCarousel title="Peliculas nuevas" contents={pelis} />}
            {series.length > 0 && <ContentCarousel title="Series nuevas" contents={series} />}
          </>
        ) : (
          <p className="px-4 text-muted-foreground md:px-8 lg:px-16">
            No hay estrenos recientes por el momento.
          </p>
        )}
      </div>
    </div>
  )
}
