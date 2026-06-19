'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)

    if (result.ok) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      router.push(result.rol === 'admin' ? '/admin' : '/profiles')
    } else {
      setError(result.error || 'Error al iniciar sesion')
    }
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/netflix-bg/1920/1080"
          alt="Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-3xl font-bold text-primary md:text-4xl">Calificación</span>
          <span className="text-3xl font-light text-foreground md:text-4xl">TV</span>
        </Link>
      </header>

      {/* Login Form */}
      <main className="relative z-10 flex justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-lg bg-background/90 p-8 md:p-12">
          <h1 className="mb-8 text-3xl font-bold text-foreground">Iniciar sesion</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded bg-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Correo electronico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-14 bg-input text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-14 bg-input pr-12 text-foreground placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-muted-foreground bg-input"
                />
                Recuerdame
              </label>
              <Link href="/forgot-password" className="text-muted-foreground hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            <p className="text-muted-foreground">
              ¿Primera vez en Quetxal TV?{' '}
              <Link href="/register" className="font-semibold text-foreground hover:underline">
                Suscribete ahora
              </Link>
            </p>

            <p className="text-xs text-muted-foreground text-pretty">
              Esta pagina esta protegida por Google reCAPTCHA para asegurar que no eres un robot.{' '}
              <button className="text-primary hover:underline">Mas informacion.</button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-border/30 bg-background/70 px-4 py-8 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-muted-foreground">
            ¿Preguntas? Llama al 1-800-QUETXAL
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
            <Link href="#" className="hover:underline">Preguntas frecuentes</Link>
            <Link href="#" className="hover:underline">Centro de ayuda</Link>
            <Link href="#" className="hover:underline">Terminos de uso</Link>
            <Link href="#" className="hover:underline">Privacidad</Link>
            <Link href="#" className="hover:underline">Preferencias de cookies</Link>
            <Link href="#" className="hover:underline">Informacion corporativa</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
