'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface Perfil {
  id: string
  nombre: string
  esInfantil: boolean
  idioma: string
}

export default function EditProfilePage({ params }: PageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [nombre, setNombre] = useState('')
  const [esInfantil, setEsInfantil] = useState(false)
  const [idioma, setIdioma] = useState('es')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  
  const [isMainProfile, setIsMainProfile] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      fetch('/api/profiles')
        .then(res => res.json())
        .then(data => {
          const allProfiles = Array.isArray(data) ? data : data.perfiles || []
          
          if (allProfiles.length > 0) {
            // Re-verify that user has access to manage
            const stored = localStorage.getItem('selectedProfile')
            let currentId: string | null = null;
            if (stored) {
              try { currentId = JSON.parse(stored).id } catch {}
            }
            if (currentId !== allProfiles[0].id) {
              router.push('/browse')
              return
            }

            // check if the current profile being edited is the main profile
            setIsMainProfile(id === allProfiles[0].id)
            
            const p = allProfiles.find((p: Perfil) => p.id === id)
            if (p) {
              setPerfil(p)
              setNombre(p.nombre)
              setEsInfantil(p.esInfantil)
              setIdioma(p.idioma)
            } else {
              setError('Perfil no encontrado')
            }
          }
        })
        .catch(err => {
          console.error('Error cargando perfil:', err)
          setError('Error cargando perfil')
        })
        .finally(() => setIsLoading(false))
    }
  }, [isAuthenticated, authLoading, router, id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })

      if (res.ok) {
        router.push('/profiles/manage')
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

  const handleDelete = async () => {
    if (isMainProfile) {
      setError('No puedes eliminar el perfil principal')
      return
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este perfil?')) {
      return
    }

    setError('')
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/profiles/manage')
      } else {
        const data = await res.json()
        setError(data.error || 'Error al eliminar el perfil')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
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

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Nombre del perfil
            </label>
            <Input
              type="text"
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
              disabled
              className="h-14 w-full rounded-md border border-border bg-muted px-3 text-muted-foreground cursor-not-allowed"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <label className="flex items-center gap-3 opacity-70">
            <input
              type="checkbox"
              checked={esInfantil}
              disabled
              className="h-5 w-5 rounded border-muted-foreground bg-input cursor-not-allowed"
            />
            <div>
              <span className="font-medium text-foreground">Perfil infantil</span>
              <p className="text-sm text-muted-foreground">
                Mostrara solo contenido apto para niños.
              </p>
            </div>
          </label>

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex gap-4">
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
                disabled={isSaving || !nombre.trim() || !perfil || nombre === perfil.nombre}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>

            {!isMainProfile && (
              <Button
                type="button"
                variant="destructive"
                className="h-12 w-full mt-2"
                disabled={isDeleting || isSaving}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Eliminando...' : 'Eliminar perfil'}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
