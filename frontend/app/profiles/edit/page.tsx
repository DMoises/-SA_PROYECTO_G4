'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [nombre, setNombre] = useState('')
  const [esInfantil, setEsInfantil] = useState(false)
  const [idioma, setIdioma] = useState('es')
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      const loadProfile = async () => {
        try {
          const res = await fetch('/api/profiles')
          if (res.ok) {
            const data = await res.json()
            const perfiles = Array.isArray(data)
              ? data
              : Array.isArray(data?.perfiles)
                ? data.perfiles
                : []
            const profile = perfiles.find((p: any) => p.id === profileId)
            if (profile) {
              setNombre(profile.nombre)
              setEsInfantil(profile.esInfantil || profile.es_infantil)
              setIdioma(profile.idioma || 'es')
            } else {
              setError('Perfil no encontrado')
            }
          }
        } catch {
          setError('Error cargando el perfil')
        } finally {
          setIsLoadingProfile(false)
        }
      }
      loadProfile()
    }
  }, [isAuthenticated, authLoading, profileId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, es_infantil: esInfantil, idioma }),
      })

      if (res.ok) {
        // Also update local storage if it's the active profile
        const stored = localStorage.getItem('selectedProfile')
        if (stored) {
          const sProfile = JSON.parse(stored)
          if (sProfile.id === profileId) {
            localStorage.setItem('selectedProfile', JSON.stringify({ id: profileId, nombre }))
          }
        }
        router.push('/profiles')
      } else {
        const data = await res.json()
        setError(data.error || 'Error al actualizar el perfil')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoadingProfile) {
    return <div className="min-h-screen bg-background"></div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-primary md:text-3xl">QUETXAL</span>
          <span className="text-2xl font-light text-foreground md:text-3xl">TV</span>
        </Link>
      </header>

      <main className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a perfiles
        </button>

        <h1 className="mb-8 text-3xl font-bold text-foreground">Editar perfil</h1>

        {error && (
          <div className="mb-6 rounded bg-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Nombre del perfil
            </label>
            <Input
              type="text"
              placeholder="Ej: Maria, Kids, etc."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="h-14 bg-input text-foreground placeholder:text-muted-foreground"
              required
              maxLength={30}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Idioma
            </label>
            <select
              value={idioma}
              onChange={e => setIdioma(e.target.value)}
              className="h-14 w-full rounded-md border border-border bg-input px-3 text-foreground"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={esInfantil}
              onChange={e => setEsInfantil(e.target.checked)}
              className="h-5 w-5 rounded border-muted-foreground bg-input"
            />
            <div>
              <span className="font-medium text-foreground">Perfil infantil</span>
              <p className="text-sm text-muted-foreground">
                Mostrara solo contenido apto para niños.
              </p>
            </div>
          </label>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1 font-semibold"
              disabled={isSaving || !nombre.trim()}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
