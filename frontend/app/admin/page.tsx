'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Film, CalendarDays, Eye, EyeOff } from 'lucide-react'

type ContentItem = {
  contenido_id: string
  titulo: string
  tipo: string
  activo: boolean
  fecha_estreno: string | null
  anio: number
}

export default function AdminDashboard() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/catalog')
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const total = items.length
  const activos = items.filter(i => i.activo).length
  const inactivos = total - activos
  const programados = items.filter(i => i.fecha_estreno && new Date(i.fecha_estreno) > new Date()).length
  const peliculas = items.filter(i => i.tipo === 'pelicula').length
  const series = items.filter(i => i.tipo === 'serie').length

  const stats = [
    { label: 'Total contenido', value: total, icon: Film, color: 'text-primary' },
    { label: 'Activos', value: activos, icon: Eye, color: 'text-green-500' },
    { label: 'Inactivos', value: inactivos, icon: EyeOff, color: 'text-red-500' },
    { label: 'Estrenos programados', value: programados, icon: CalendarDays, color: 'text-yellow-500' },
  ]

  return (
    <div className="p-8">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Panel de Administración</h1>
      <p className="mb-8 text-muted-foreground">Gestiona el catálogo y programa estrenos de QuetxalTV.</p>

      {loading ? (
        <div className="text-muted-foreground">Cargando estadísticas...</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-card border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Películas</p>
              <p className="text-2xl font-bold">{peliculas}</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Series</p>
              <p className="text-2xl font-bold">{series}</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex gap-4">
            <Link
              href="/admin/catalog/nuevo"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              + Agregar contenido
            </Link>
            <Link
              href="/admin/catalog"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Ver catálogo
            </Link>
            <Link
              href="/admin/estrenos"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Programar estrenos
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
