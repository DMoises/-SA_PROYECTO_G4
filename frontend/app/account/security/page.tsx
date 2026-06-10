'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/lib/auth-context'

export default function SecurityPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [isMainProfile, setIsMainProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
          setIsMainProfile(true)
        })
        .catch(() => setError('Error cargando datos'))
        .finally(() => setIsLoading(false))
    }
  }, [isAuthenticated, authLoading, router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setSuccess('Contraseña actualizada correctamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al cambiar la contraseña')
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

        <h1 className="mb-8 text-3xl font-bold text-foreground">Seguridad y privacidad</h1>

        {error && (
          <div className="mb-6 rounded bg-destructive/20 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="mb-6 rounded bg-green-500/20 p-3 text-sm text-green-500">{success}</div>
        )}

        <div className="space-y-6">
          <div className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Información de la cuenta</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md bg-muted/40 px-4 py-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">ID de usuario</p>
                  <p className="text-sm font-medium text-foreground">{user?.usuario_id || 'Cargando...'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Cambiar contraseña</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Contraseña actual
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="h-12 bg-input text-foreground"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Nueva contraseña
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="h-12 bg-input text-foreground"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Confirmar nueva contraseña
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-12 bg-input text-foreground"
                  required
                  autoComplete="new-password"
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
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isSaving ? 'Guardando...' : 'Cambiar contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
