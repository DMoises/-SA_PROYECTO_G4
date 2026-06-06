'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const avatarColors = [
  { id: '1', gradient: 'from-primary to-primary/70' },
  { id: '2', gradient: 'from-blue-500 to-blue-700' },
  { id: '3', gradient: 'from-green-500 to-green-700' },
  { id: '4', gradient: 'from-yellow-500 to-yellow-700' },
  { id: '5', gradient: 'from-purple-500 to-purple-700' },
  { id: '6', gradient: 'from-pink-500 to-pink-700' },
  { id: '7', gradient: 'from-orange-500 to-orange-700' },
  { id: '8', gradient: 'from-teal-500 to-teal-700' },
]

export default function AddProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('1')
  const [isKid, setIsKid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500))
    router.push('/profiles')
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

      {/* Form */}
      <main className="w-full max-w-lg">
        <h1 className="mb-2 text-3xl font-medium text-foreground md:text-4xl">
          Agregar perfil
        </h1>
        <p className="mb-8 text-muted-foreground">
          Agrega un perfil para otra persona que use Quetxal TV.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Selection */}
          <div>
            <label className="mb-4 block text-sm font-medium text-foreground">
              Elige un avatar
            </label>
            <div className="flex flex-wrap gap-3">
              {avatarColors.map(avatar => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`h-16 w-16 rounded bg-gradient-to-br ${avatar.gradient} transition-all ${
                    selectedAvatar === avatar.id
                      ? 'ring-4 ring-foreground ring-offset-2 ring-offset-background'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Nombre del perfil
            </label>
            <Input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-12 bg-input text-foreground placeholder:text-muted-foreground"
              required
              maxLength={20}
            />
          </div>

          {/* Kids Profile Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isKid"
              checked={isKid}
              onChange={e => setIsKid(e.target.checked)}
              className="h-5 w-5 rounded border-muted-foreground bg-input"
            />
            <label htmlFor="isKid" className="cursor-pointer text-foreground">
              ¿Es un perfil infantil?
            </label>
          </div>
          {isKid && (
            <p className="text-sm text-muted-foreground">
              Los perfiles infantiles solo muestran contenido clasificado para todas las edades.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-4 border-t border-border pt-6">
            <Button
              type="submit"
              className="flex-1"
              disabled={!name || isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/profiles')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
