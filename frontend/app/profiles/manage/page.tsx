'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useAdminGuard } from '@/lib/use-admin-guard'

interface Perfil {
  id: string
  nombre: string
  esInfantil?: boolean
  es_infantil?: boolean
  idioma: string
}

export default function ManageProfilesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // Solo el perfil administrador puede administrar perfiles.
  useAdminGuard()
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [isLoadingPerfiles, setIsLoadingPerfiles] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const profileColors = [
    'from-primary to-primary/70',
    'from-blue-500 to-blue-700',
    'from-green-500 to-green-700',
    'from-yellow-500 to-yellow-700',
    'from-purple-500 to-purple-700',
  ]

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      // Check if current profile is the main profile
      const stored = localStorage.getItem('selectedProfile')
      let currentId: string | null = null;
      if (stored) {
        try {
          currentId = JSON.parse(stored).id
        } catch {}
      }

      fetch('/api/profiles')
        .then(res => res.json())
        .then(data => {
          const allProfiles = Array.isArray(data) ? data : data.perfiles || []
          setPerfiles(allProfiles)
          setIsLoadingPerfiles(false)

        })
        .catch(err => {
          console.error('Error cargando perfiles:', err)
          setIsLoadingPerfiles(false)
        })
    }
  }, [isAuthenticated, authLoading, router])

  const handleDelete = async (perfil: Perfil, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`¿Eliminar el perfil "${perfil.nombre}"?`)) return
    setDeletingId(perfil.id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/profiles/${perfil.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPerfiles(prev => prev.filter(p => p.id !== perfil.id))
      } else {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error || `No se pudo eliminar el perfil "${perfil.nombre}"`)
      }
    } catch {
      setDeleteError(`Error de red al eliminar el perfil "${perfil.nombre}"`)
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || isLoadingPerfiles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <header className="fixed left-0 right-0 top-0 flex items-center px-4 py-6 md:px-8 lg:px-16">
        <Link href="/browse" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </header>

      <main className="flex flex-col items-center">
        <h1 className="mb-8 text-3xl font-medium text-foreground md:text-4xl lg:text-5xl">
          Administrar perfiles
        </h1>

        {deleteError && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600">
            {deleteError}
          </div>
        )}

        <div className="mb-8 flex flex-wrap justify-center gap-4 md:gap-6">
          {perfiles.map((perfil, index) => (
            <div key={perfil.id} className="group flex flex-col items-center">
              <Link
                href={`/profiles/manage/${perfil.id}`}
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="relative">
                  <div
                    className={`h-24 w-24 overflow-hidden rounded bg-gradient-to-br ${profileColors[index % profileColors.length]} transition-all duration-200 md:h-32 md:w-32 lg:h-36 lg:w-36 group-hover:ring-4 group-hover:ring-foreground`}
                  >
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white md:text-5xl">
                      {perfil.nombre.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center rounded bg-background/60">
                    <Pencil className="h-8 w-8 text-foreground" />
                  </div>

                  {(perfil.es_infantil ?? perfil.esInfantil) && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                      KIDS
                    </span>
                  )}
                </div>
                <span className="mt-3 text-sm text-muted-foreground group-hover:text-foreground md:text-base">
                  {perfil.nombre}
                </span>
              </Link>

              {index !== 0 && (
                <button
                  onClick={(e) => handleDelete(perfil, e)}
                  disabled={deletingId === perfil.id}
                  className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  {deletingId === perfil.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Eliminar
                </button>
              )}
            </div>
          ))}

          {perfiles.length < 5 && (
            <Link
              href="/profiles/add"
              className="group flex flex-col items-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-muted-foreground/50 bg-transparent transition-colors group-hover:border-foreground md:h-32 md:w-32 lg:h-36 lg:w-36">
                <Plus className="h-12 w-12 text-muted-foreground group-hover:text-foreground md:h-16 md:w-16" />
              </div>
              <span className="mt-3 text-sm text-muted-foreground group-hover:text-foreground md:text-base">
                Agregar perfil
              </span>
            </Link>
          )}
        </div>

        <button
          onClick={() => router.push('/browse')}
          className="rounded border border-muted-foreground/50 px-6 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Listo
        </button>
      </main>
    </div>
  )
}
