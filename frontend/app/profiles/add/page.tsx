'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useKidsGuard } from '@/lib/use-kids-guard'

export default function AddProfilePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  // Un perfil infantil no puede crear nuevos perfiles.
  useKidsGuard()
  const [nombre, setNombre] = useState('')
  const [esInfantil, setEsInfantil] = useState(false)
  const [idioma, setIdioma] = useState('es')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // El PIN de Control Parental solo aplica a perfiles infantiles y debe
    // tener exactamente 4 digitos. Si no se indica, el backend usa '1234'.
    if (esInfantil && pin && !/^\d{4}$/.test(pin)) {
      setError('El PIN de Control Parental debe tener exactamente 4 digitos.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          es_infantil: esInfantil,
          idioma,
          // Solo se envia el PIN para perfiles infantiles.
          ...(esInfantil && pin ? { pin } : {}),
        }),
      })

      if (res.ok) {
        router.push('/profiles')
      } else {
        const data = await res.json()
        setError(data.error || 'Error al crear el perfil')
      }
    } catch {
      setError('Error de conexion')
    } finally {
      setIsLoading(false)
    }
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

        <h1 className="mb-8 text-3xl font-bold text-foreground">Agregar perfil</h1>

        <p className="mb-6 text-muted-foreground">
          Agrega un perfil para otra persona que use Quetxal TV.
        </p>

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

          {esInfantil && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                PIN de Control Parental (4 dígitos)
              </label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Ej: 1234"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="h-14 bg-input text-foreground placeholder:text-muted-foreground tracking-[0.5em]"
                maxLength={4}
                autoComplete="off"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Se solicitará este PIN para reproducir contenido no apto para niños.
                Si lo dejas vacío, se usará <span className="font-semibold">1234</span> por defecto.
              </p>
            </div>
          )}

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
              disabled={isLoading || !nombre.trim()}
            >
              {isLoading ? 'Creando...' : 'Crear perfil'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
