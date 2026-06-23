'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tv, ArrowLeft, Loader2 } from 'lucide-react'
import { validarSala } from '@/lib/api/watchparty'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'

export default function WatchPartyLandingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const cleanedCode = code.trim().toLowerCase()

    if (cleanedCode.length !== 6) {
      setError('El código debe tener exactamente 6 caracteres.')
      return
    }

    try {
      setLoading(true)
      const res = await validarSala(cleanedCode)
      if (res.existe || res.exists) {
        router.push(`/watchparty/${cleanedCode}`)
      } else {
        setError('La sala no existe o ha expirado. Verifica el código.')
      }
    } catch (err) {
      console.error('Error validating room code:', err)
      setError('Ocurrió un error al validar el código. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 mt-16">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Tv className="h-6 w-6 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">Unirse a una Watch Party</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Ingresa el código de 6 caracteres de la sala para reproducir contenido sincronizado con tus amigos.
          </p>

          <form onSubmit={handleJoin} className="w-full space-y-4">
            <div className="space-y-2">
              <label htmlFor="code-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Código de la sala
              </label>
              <input
                id="code-input"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="e.g. 3f1a2c"
                className="w-full h-12 bg-secondary border border-border rounded-xl px-4 text-center font-mono text-xl tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full h-12 rounded-xl" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Unirse a la sala'
              )}
            </Button>
          </form>

          <div className="mt-8 border-t border-border w-full pt-6 flex justify-center">
            <Link href="/browse" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <ArrowLeft className="h-3 w-3" />
              Volver a la cartelera
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
