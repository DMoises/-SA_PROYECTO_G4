'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarDays } from 'lucide-react'

type ContentItem = {
  contenido_id: string
  titulo: string
  tipo: string
  anio: number | null
  clasificacion: string
  activo: boolean
  fecha_estreno: string | null
  generos: string
}

export default function AdminCatalogPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/admin/catalog')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? El contenido quedará inactivo.`)) return
    setDeletingId(id)
    try {
      const r = await fetch(`/api/admin/catalog/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      await load()
    } catch {
      alert('Error al eliminar el contenido.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = items.filter(i =>
    i.titulo.toLowerCase().includes(filter.toLowerCase()) ||
    i.tipo.toLowerCase().includes(filter.toLowerCase()),
  )

  const now = new Date()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
          <p className="text-sm text-muted-foreground">{items.length} títulos en total</p>
        </div>
        <Link
          href="/admin/catalog/nuevo"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo contenido
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar por título o tipo..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Título</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Año</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clasificación</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estreno</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No hay contenido que coincida.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const tieneEstreno = !!item.fecha_estreno
                  const estrenoPendiente = tieneEstreno && new Date(item.fecha_estreno!) > now
                  return (
                    <tr key={item.contenido_id} className="bg-card hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                        {item.titulo}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{item.tipo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.anio ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.clasificacion}</td>
                      <td className="px-4 py-3">
                        {item.activo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                            <Eye className="h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                            <EyeOff className="h-3 w-3" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {estrenoPendiente ? (
                          <span className="inline-flex items-center gap-1 text-yellow-500">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(item.fecha_estreno!).toLocaleDateString('es-GT')}
                          </span>
                        ) : tieneEstreno ? (
                          <span className="text-green-600">
                            {new Date(item.fecha_estreno!).toLocaleDateString('es-GT')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/catalog/${item.contenido_id}/editar`}
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.contenido_id, item.titulo)}
                            disabled={deletingId === item.contenido_id}
                            className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
