'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Perfil {
  id: string
  nombre: string
  esInfantil: boolean
  idioma: string
}

export default function ProfilesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [isManaging, setIsManaging] = useState(false)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [isLoadingPerfiles, setIsLoadingPerfiles] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      fetchPerfiles()
    }
  }, [isAuthenticated, authLoading])

  const fetchPerfiles = async () => {
    try {
      const res = await fetch('/api/profiles')
      if (res.ok) {
        const data = await res.json()
        setPerfiles(Array.isArray(data) ? data : data.perfiles || [])
      }
    } catch (err) {
      console.error('Error cargando perfiles:', err)
    } finally {
      setIsLoadingPerfiles(false)
    }
  }

  const handleProfileSelect = (profileId: string) => {
    if (isManaging) return
    const perfil = perfiles.find(p => p.id === profileId)
    if (perfil) {
      localStorage.setItem('selectedProfile', JSON.stringify({ id: perfil.id, nombre: perfil.nombre }))
    }
    router.push('/browse')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const profileColors = [
    'from-primary to-primary/70',
    'from-blue-500 to-blue-700',
    'from-green-500 to-green-700',
    'from-yellow-500 to-yellow-700',
    'from-purple-500 to-purple-700',
  ]

  if (authLoading || isLoadingPerfiles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 flex items-center justify-between px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-primary md:text-3xl">QUETXAL</span>
          <span className="text-2xl font-light text-foreground md:text-3xl">TV</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </header>

      {/* Profile Selection */}
      <main className="flex flex-col items-center">
        <h1 className="mb-8 text-3xl font-medium text-foreground md:text-4xl lg:text-5xl">
          {isManaging ? 'Administrar perfiles' : '¿Quien esta viendo?'}
        </h1>

        <div className="mb-8 flex flex-wrap justify-center gap-4 md:gap-6">
          {perfiles.map((perfil, index) => (
            <button
              key={perfil.id}
              onClick={() => handleProfileSelect(perfil.id)}
              className="group flex flex-col items-center"
            >
              <div className="relative">
                <div
                  className={`h-24 w-24 overflow-hidden rounded bg-gradient-to-br ${profileColors[index % profileColors.length]} transition-all duration-200 md:h-32 md:w-32 lg:h-36 lg:w-36 ${
                    !isManaging && 'group-hover:ring-4 group-hover:ring-foreground'
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white md:text-5xl">
                    {perfil.nombre.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Edit Overlay */}
                {isManaging && (
                  <div className="absolute inset-0 flex items-center justify-center rounded bg-background/60">
                    <Pencil className="h-8 w-8 text-foreground" />
                  </div>
                )}

                {/* Kids Badge */}
                {perfil.esInfantil && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    KIDS
                  </span>
                )}
              </div>
              <span className="mt-3 text-sm text-muted-foreground group-hover:text-foreground md:text-base">
                {perfil.nombre}
              </span>
            </button>
          ))}

          {/* Add Profile Button */}
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

        {/* Manage Profiles Button */}
        <button
          onClick={() => setIsManaging(!isManaging)}
          className="rounded border border-muted-foreground/50 px-6 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          {isManaging ? 'Listo' : 'Administrar perfiles'}
        </button>
      </main>
    </div>
  )
}
