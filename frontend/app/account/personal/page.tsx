'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'

function PersonalInfoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profileId')
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [nombre, setNombre] = useState('')
  const [originalNombre, setOriginalNombre] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
          const stored = localStorage.getItem('selectedProfile')
          let currentId: string | null = null
          if (stored) {
            try { currentId = JSON.parse(stored).id } catch {}
          }
          if (!currentId || allProfiles.length === 0 || currentId !== allProfiles[0].id) {
            router.push('/browse')
            return
          }
          const main = allProfiles[0]
          setNombre(main.nombre)
          setOriginalNombre(main.nombre)
        })
        .catch(() => setError('Error cargando perfil'))
        .finally(() => setIsLoading(false))
    }
  }, [isAuthenticated, authLoading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId && !nombre) return
    setError('')
    setSuccess('')
    setIsSaving(true)

    const id = profileId || (() => {
      const stored = localStorage.getItem('selectedProfile')
      try { return JSON.parse(stored || '').id } catch { return null }
    })()

    if (!id) {
      setError('No se pudo identificar el perfil')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
      if (res.ok) {
        setOriginalNombre(nombre)
        setSuccess('Perfil actualizado correctamente')
        const stored = localStorage.getItem('selectedProfile')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            localStorage.setItem('selectedProfile', JSON.stringify({ ...parsed, nombre }))
          } catch {}
        }
      } else {
        const data = await res.json()
        if (res.status === 409) {
          setError('Ya existe un perfil con ese nombre. Intenta con otro.')
        } else {
          setError(data.error || 'Error al actualizar')
        }
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setIsSaving(false)
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-24 pb-16 md:px-8">
        <Link
          href="/account"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Cuenta
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-foreground">Información personal</h1>

        {error && (
          <div className="mb-6 rounded bg-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="mb-6 rounded bg-green-500/20 p-3 text-sm text-green-500">{success}</div>
        )}

        <div className="rounded-lg bg-card p-6 space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Correo electrónico
            </label>
            <p className="text-foreground">{user?.email || 'Cargando...'}</p>
            <p className="text-xs text-muted-foreground mt-1">El correo no puede modificarse desde aquí</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Nombre del perfil principal
              </label>
              <Input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="h-12 bg-input text-foreground"
                required
                maxLength={30}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => router.push('/account')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 flex-1 font-semibold"
                disabled={isSaving || !nombre.trim() || nombre === originalNombre}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function PersonalInfoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <PersonalInfoForm />
    </Suspense>
  )
}
