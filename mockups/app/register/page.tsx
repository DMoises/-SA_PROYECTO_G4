'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 1) {
      setStep(2)
      return
    }

    setIsLoading(true)
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/account/plans')
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://picsum.photos/seed/netflix-register/1920/1080"
          alt="Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/30 px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-3xl font-bold text-primary md:text-4xl">QUETXAL</span>
          <span className="text-3xl font-light text-foreground md:text-4xl">TV</span>
        </Link>
        <Link
          href="/login"
          className="text-lg font-semibold text-foreground hover:underline"
        >
          Iniciar sesion
        </Link>
      </header>

      {/* Registration Form */}
      <main className="relative z-10 flex justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className={`h-1 w-24 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 w-24 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          <div className="rounded-lg bg-background/90 p-8 md:p-12">
            {step === 1 ? (
              <>
                <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Paso 1 de 2
                </p>
                <h1 className="mb-4 text-3xl font-bold text-foreground">
                  Crea una cuenta
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                  Solo faltan un par de pasos mas y listo. Tambien odiamos el papeleo.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    type="email"
                    placeholder="Correo electronico"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 bg-input text-foreground placeholder:text-muted-foreground"
                    required
                  />

                  <Button type="submit" className="h-14 w-full text-lg font-semibold">
                    Continuar
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Paso 2 de 2
                </p>
                <h1 className="mb-4 text-3xl font-bold text-foreground">
                  Configura tu cuenta
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                  Ingresa tu nombre y crea una contraseña para tu cuenta.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    type="text"
                    placeholder="Nombre completo"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="h-14 bg-input text-foreground placeholder:text-muted-foreground"
                    required
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="h-14 bg-input pr-12 text-foreground placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">Tu contraseña debe tener:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${formData.password.length >= 6 ? 'text-green-500' : 'text-muted-foreground'}`} />
                        Al menos 6 caracteres
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`} />
                        Una letra mayuscula
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`} />
                        Un numero
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 rounded border-muted-foreground bg-input"
                      />
                      <span className="text-sm text-muted-foreground">
                        Si, quiero recibir ofertas especiales de Quetxal TV por correo electronico.
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="h-14 w-full text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-card/50 p-4 text-center">
              <div className="mb-2 text-2xl">📺</div>
              <h3 className="font-semibold text-foreground">Mira donde quieras</h3>
              <p className="text-sm text-muted-foreground">Smart TV, PlayStation, Xbox, Chromecast y mas</p>
            </div>
            <div className="rounded-lg bg-card/50 p-4 text-center">
              <div className="mb-2 text-2xl">⬇️</div>
              <h3 className="font-semibold text-foreground">Descarga tus series</h3>
              <p className="text-sm text-muted-foreground">Guarda tu contenido y miralo sin conexion</p>
            </div>
            <div className="rounded-lg bg-card/50 p-4 text-center">
              <div className="mb-2 text-2xl">🚫</div>
              <h3 className="font-semibold text-foreground">Sin compromisos</h3>
              <p className="text-sm text-muted-foreground">Cancela cuando quieras sin cargos</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
