import { Navbar } from '@/components/navbar'
import { ContentCarousel } from '@/components/content-carousel'
import { fetchCartelera } from '@/lib/catalog-gateway'
import { Content } from '@/lib/types'

// Series reales del catalogo (tipo = series), agrupadas por genero real.
export const dynamic = 'force-dynamic'

export default async function SeriesPage() {
  const cartelera = await fetchCartelera().catch(() => [] as Content[])
  const series = cartelera.filter(c => c.type === 'series')
  const generos = Array.from(new Set(series.flatMap(s => s.genres))).sort()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full pt-16">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/series-hero/1920/800"
            alt="Series"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
        <div className="relative flex h-full flex-col justify-center px-4 md:px-8 lg:px-16">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Series</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Explora nuestras series. Encuentra tu proxima obsesion.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="-mt-20 relative z-10 space-y-8 pb-16">
        {series.length > 0 ? (
          <>
            <ContentCarousel title="Todas las series" contents={series} />
            {generos.map(g => (
              <ContentCarousel key={g} title={g} contents={series.filter(s => s.genres.includes(g))} />
            ))}
          </>
        ) : (
          <p className="px-4 text-muted-foreground md:px-8 lg:px-16">
            No hay series en el catalogo por el momento.
          </p>
        )}
      </div>
    </div>
  )
}
