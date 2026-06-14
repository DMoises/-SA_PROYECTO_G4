'use client'

import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react'

type ContentItem = {
  contenido_id: string
  titulo: string
  tipo: string
  activo: boolean
  fecha_estreno: string | null
}

type ScheduleEntry = ContentItem & { nueva_fecha: string }

function toLocalDatetime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EstrenosPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [localDates, setLocalDates] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'todos' | 'programados' | 'sin_programar'>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/catalog')
      const data = await r.json()
      const list: ContentItem[] = Array.isArray(data) ? data : []
      setItems(list)
      const dates: Record<string, string> = {}
      list.forEach(i => { dates[i.contenido_id] = toLocalDatetime(i.fecha_estreno) })
      setLocalDates(dates)
    } catch {
      setError('No se pudo cargar el catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (item: ContentItem) => {
    setSaving(item.contenido_id)
    try {
      const fechaISO = localDates[item.contenido_id]
        ? new Date(localDates[item.contenido_id]).toISOString()
        : null
      const r = await fetch(`/api/admin/catalog/${item.contenido_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_estreno: fechaISO }),
      })
      if (!r.ok) throw new Error()
      setSaved(item.contenido_id)
      setTimeout(() => setSaved(null), 2000)
      await load()
    } catch {
      alert('Error al guardar la fecha de estreno.')
    } finally {
      setSaving(null)
    }
  }

  const handleClear = async (item: ContentItem) => {
    if (!confirm(`¿Quitar la fecha de estreno de "${item.titulo}"?`)) return
    setSaving(item.contenido_id)
    try {
      const r = await fetch(`/api/admin/catalog/${item.contenido_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_estreno: null }),
      })
      if (!r.ok) throw new Error()
      await load()
    } catch {
      alert('Error al quitar la fecha de estreno.')
    } finally {
      setSaving(null)
    }
  }

  const now = new Date()

  const filtered = items.filter(i => {
    if (filter === 'programados') return !!i.fecha_estreno && new Date(i.fecha_estreno) > now
    if (filter === 'sin_programar') return !i.fecha_estreno
    return true
  })

  // Agrupar estrenos proximos por mes para la vista de calendario
  const proximos = items
    .filter(i => i.fecha_estreno && new Date(i.fecha_estreno) > now)
    .sort((a, b) => new Date(a.fecha_estreno!).getTime() - new Date(b.fecha_estreno!).getTime())

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Estrenos programados</h1>
        <p className="text-sm text-muted-foreground">
          Define la fecha exacta en que un título pasará a estar visible en la cartelera.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Próximos estrenos */}
      {!loading && proximos.length > 0 && (
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos estrenos
          </h2>
          <div className="space-y-2">
            {proximos.map(item => (
              <div key={item.contenido_id} className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-2">
                <div>
                  <span className="font-medium text-foreground">{item.titulo}</span>
                  <span className="ml-2 text-xs text-muted-foreground capitalize">({item.tipo})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-500">
                  <Clock className="h-4 w-4" />
                  {new Date(item.fecha_estreno!).toLocaleString('es-GT', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex gap-2">
        {(['todos', 'programados', 'sin_programar'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {f === 'todos' ? 'Todos' : f === 'programados' ? 'Con estreno' : 'Sin programar'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Título</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado actual</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-64">Fecha de estreno</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No hay contenido en esta categoría.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const tieneEstreno = !!item.fecha_estreno
                  const pendiente = tieneEstreno && new Date(item.fecha_estreno!) > now
                  const isSaving = saving === item.contenido_id
                  const isSaved = saved === item.contenido_id
                  return (
                    <tr key={item.contenido_id} className="bg-card hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{item.titulo}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{item.tipo}</td>
                      <td className="px-4 py-3">
                        {pendiente ? (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                            <Clock className="h-3 w-3" /> Pendiente
                          </span>
                        ) : tieneEstreno ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" /> Estrenado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3 w-3" /> Sin programar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={localDates[item.contenido_id] ?? ''}
                          onChange={e => setLocalDates(prev => ({
                            ...prev,
                            [item.contenido_id]: e.target.value,
                          }))}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(item)}
                            disabled={isSaving}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isSaving ? '...' : isSaved ? '✓ Guardado' : 'Guardar'}
                          </button>
                          {tieneEstreno && (
                            <button
                              onClick={() => handleClear(item)}
                              disabled={isSaving}
                              className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                            >
                              Quitar
                            </button>
                          )}
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
