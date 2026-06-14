'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ContentForm, ContentFormData } from '../../_components/ContentForm'

type ApiContent = {
  contenido_id: string
  titulo: string
  tipo: string
  sinopsis: string | null
  anio: number | null
  clasificacion: string
  duracion_min: number | null
  portada_url: string | null
  video_url: string | null
  activo: boolean
  fecha_estreno: string | null
  generos: string
  categorias: string
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  // Format: YYYY-MM-DDTHH:MM for datetime-local input
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditarContenidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [initialData, setInitialData] = useState<Partial<ContentFormData> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/catalog/${id}`)
      .then(r => r.json())
      .then((d: ApiContent) => {
        setInitialData({
          titulo: d.titulo,
          tipo: d.tipo as 'pelicula' | 'serie',
          sinopsis: d.sinopsis ?? '',
          anio: d.anio != null ? String(d.anio) : '',
          clasificacion: d.clasificacion,
          duracion_min: d.duracion_min != null ? String(d.duracion_min) : '',
          portada_url: d.portada_url ?? '',
          video_url: d.video_url ?? '',
          activo: d.activo,
          fecha_estreno: toLocalDatetime(d.fecha_estreno),
          generos: d.generos,
          categorias: d.categorias,
        })
      })
      .catch(() => setFetchError('No se pudo cargar el contenido.'))
  }, [id])

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true)
    setError('')
    try {
      const r = await fetch(`/api/admin/catalog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const res = await r.json()
      if (!r.ok) {
        setError(res.error || 'Error al actualizar el contenido.')
        return
      }
      router.push('/admin/catalog')
    } catch {
      setError('Error de conexión.')
    } finally {
      setIsLoading(false)
    }
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      </div>
    )
  }

  if (!initialData) {
    return <div className="p-8 text-muted-foreground">Cargando...</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Editar contenido</h1>
        <p className="text-sm text-muted-foreground">Modifica los metadatos de la película o serie.</p>
      </div>
      <div className="rounded-lg bg-card border border-border p-6">
        <ContentForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
