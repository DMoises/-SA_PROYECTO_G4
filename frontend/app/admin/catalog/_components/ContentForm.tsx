'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type ContentFormData = {
  titulo: string
  tipo: 'pelicula' | 'serie'
  sinopsis: string
  anio: string
  clasificacion: string
  duracion_min: string
  portada_url: string
  video_url: string
  activo: boolean
  fecha_estreno: string
  generos: string
  categorias: string
}

const EMPTY: ContentFormData = {
  titulo: '',
  tipo: 'pelicula',
  sinopsis: '',
  anio: '',
  clasificacion: 'TP',
  duracion_min: '',
  portada_url: '',
  video_url: '',
  activo: true,
  fecha_estreno: '',
  generos: '',
  categorias: '',
}

interface Props {
  initialData?: Partial<ContentFormData>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitLabel: string
  isLoading: boolean
  error: string
}

export function ContentForm({ initialData, onSubmit, submitLabel, isLoading, error }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ContentFormData>({ ...EMPTY, ...initialData })
  const [generosSugeridos, setGenerosSugeridos] = useState<string[]>([])
  const [categoriasSugeridas, setCategoriasSugeridas] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/catalog/generos')
      .then(r => r.json())
      .then(d => setGenerosSugeridos((d as { nombre: string }[]).map(g => g.nombre)))
      .catch(() => {})
    fetch('/api/admin/catalog/categorias')
      .then(r => r.json())
      .then(d => setCategoriasSugeridas((d as { nombre: string }[]).map(c => c.nombre)))
      .catch(() => {})
  }, [])

  const set = (k: keyof ContentFormData, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      titulo: form.titulo,
      tipo: form.tipo,
      sinopsis: form.sinopsis || null,
      anio: form.anio ? parseInt(form.anio) : null,
      clasificacion: form.clasificacion,
      duracion_min: form.tipo === 'pelicula' && form.duracion_min ? parseInt(form.duracion_min) : null,
      portada_url: form.portada_url || null,
      video_url: form.video_url || null,
      activo: form.activo,
      fecha_estreno: form.fecha_estreno ? new Date(form.fecha_estreno).toISOString() : null,
      generos: form.generos.split(',').map(s => s.trim()).filter(Boolean),
      categorias: form.categorias.split(',').map(s => s.trim()).filter(Boolean),
    }
    await onSubmit(payload)
  }

  const labelCls = 'block text-sm font-medium text-foreground mb-1'
  const inputCls = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Título */}
        <div className="md:col-span-2">
          <label className={labelCls}>Título *</label>
          <input
            required
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
            className={inputCls}
            placeholder="Título del contenido"
          />
        </div>

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo *</label>
          <select
            value={form.tipo}
            onChange={e => set('tipo', e.target.value as 'pelicula' | 'serie')}
            className={inputCls}
          >
            <option value="pelicula">Película</option>
            <option value="serie">Serie</option>
          </select>
        </div>

        {/* Clasificación */}
        <div>
          <label className={labelCls}>Clasificación</label>
          <select
            value={form.clasificacion}
            onChange={e => set('clasificacion', e.target.value)}
            className={inputCls}
          >
            {['TP', '+7', '+13', '+16', '+18'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <label className={labelCls}>Año</label>
          <input
            type="number"
            min={1888}
            max={2100}
            value={form.anio}
            onChange={e => set('anio', e.target.value)}
            className={inputCls}
            placeholder="2024"
          />
        </div>

        {/* Duración (solo películas) */}
        {form.tipo === 'pelicula' && (
          <div>
            <label className={labelCls}>Duración (minutos)</label>
            <input
              type="number"
              min={1}
              value={form.duracion_min}
              onChange={e => set('duracion_min', e.target.value)}
              className={inputCls}
              placeholder="120"
            />
          </div>
        )}

        {/* Sinopsis */}
        <div className="md:col-span-2">
          <label className={labelCls}>Sinopsis</label>
          <textarea
            rows={3}
            value={form.sinopsis}
            onChange={e => set('sinopsis', e.target.value)}
            className={inputCls}
            placeholder="Descripción del contenido..."
          />
        </div>

        {/* Géneros */}
        <div>
          <label className={labelCls}>Géneros (separados por coma)</label>
          <input
            value={form.generos}
            onChange={e => set('generos', e.target.value)}
            className={inputCls}
            placeholder="Acción, Drama, Comedia"
            list="generos-list"
          />
          <datalist id="generos-list">
            {generosSugeridos.map(g => <option key={g} value={g} />)}
          </datalist>
        </div>

        {/* Categorías */}
        <div>
          <label className={labelCls}>Categorías (separadas por coma)</label>
          <input
            value={form.categorias}
            onChange={e => set('categorias', e.target.value)}
            className={inputCls}
            placeholder="Tendencias, Destacados"
            list="categorias-list"
          />
          <datalist id="categorias-list">
            {categoriasSugeridas.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* URL portada */}
        <div>
          <label className={labelCls}>URL portada</label>
          <input
            type="url"
            value={form.portada_url}
            onChange={e => set('portada_url', e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>

        {/* URL video */}
        <div>
          <label className={labelCls}>URL video</label>
          <input
            type="url"
            value={form.video_url}
            onChange={e => set('video_url', e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>

        {/* Fecha de estreno */}
        <div>
          <label className={labelCls}>Fecha de estreno (programado)</label>
          <input
            type="datetime-local"
            value={form.fecha_estreno}
            onChange={e => set('fecha_estreno', e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Si se define, el contenido solo aparece en la cartelera a partir de esta fecha.
          </p>
        </div>

        {/* Activo */}
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="activo"
            checked={form.activo}
            onChange={e => set('activo', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="activo" className="text-sm font-medium text-foreground">
            Contenido activo (visible en cartelera)
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
