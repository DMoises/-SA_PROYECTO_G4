'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentForm } from '../_components/ContentForm'

export default function NuevoContenidoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true)
    setError('')
    try {
      const r = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const res = await r.json()
      if (!r.ok) {
        setError(res.error || 'Error al crear el contenido.')
        return
      }
      router.push('/admin/catalog')
    } catch {
      setError('Error de conexión.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nuevo contenido</h1>
        <p className="text-sm text-muted-foreground">Agrega una nueva película o serie al catálogo.</p>
      </div>
      <div className="rounded-lg bg-card border border-border p-6">
        <ContentForm
          onSubmit={handleSubmit}
          submitLabel="Crear contenido"
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
