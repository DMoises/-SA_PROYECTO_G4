'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Monitor, Smartphone, Tablet, Tv } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockPlans } from '@/lib/mock-data'

export default function PlansPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('standard')
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    setIsLoading(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/profiles')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/30 px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-primary md:text-3xl">QUETXAL</span>
          <span className="text-2xl font-light text-foreground md:text-3xl">TV</span>
        </Link>
        <Link href="/login" className="text-sm font-semibold text-foreground hover:underline">
          Cerrar sesion
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Step Indicator */}
        <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
          Paso 1 de 3
        </p>
        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          Elige el plan ideal para ti
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Cambia o cancela en cualquier momento.
        </p>

        {/* Features */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-card p-4">
            <Check className="h-6 w-6 text-primary" />
            <span className="text-sm text-foreground">Sin compromisos, cancela cuando quieras</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card p-4">
            <Check className="h-6 w-6 text-primary" />
            <span className="text-sm text-foreground">Todo Quetxal TV a un bajo precio</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card p-4">
            <Check className="h-6 w-6 text-primary" />
            <span className="text-sm text-foreground">Sin anuncios ni interrupciones</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card p-4">
            <Check className="h-6 w-6 text-primary" />
            <span className="text-sm text-foreground">Mira en cualquier dispositivo</span>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="p-4 text-left"></th>
                {mockPlans.map(plan => (
                  <th key={plan.id} className="p-2">
                    <button
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full rounded-lg p-4 text-center transition-all ${
                        selectedPlan === plan.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-card-foreground hover:bg-accent'
                      }`}
                    >
                      <div className="text-lg font-bold">{plan.name}</div>
                      <div className="text-2xl font-bold">
                        Q{plan.price}
                        <span className="text-sm font-normal">/mes</span>
                      </div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-4 text-muted-foreground">Calidad de video</td>
                {mockPlans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    <span
                      className={`font-medium ${
                        selectedPlan === plan.id ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {plan.quality}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Pantallas simultaneas</td>
                {mockPlans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    <span
                      className={`font-medium ${
                        selectedPlan === plan.id ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {plan.screens}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Descargas</td>
                {mockPlans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.downloads ? (
                      <Check
                        className={`mx-auto h-5 w-5 ${
                          selectedPlan === plan.id ? 'text-primary' : 'text-green-500'
                        }`}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Dispositivos</td>
                {mockPlans.map(plan => (
                  <td key={plan.id} className="p-4">
                    <div className="flex justify-center gap-2">
                      <Smartphone
                        className={`h-5 w-5 ${
                          selectedPlan === plan.id ? 'text-primary' : 'text-foreground'
                        }`}
                      />
                      <Tablet
                        className={`h-5 w-5 ${
                          plan.screens >= 2
                            ? selectedPlan === plan.id
                              ? 'text-primary'
                              : 'text-foreground'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                      <Monitor
                        className={`h-5 w-5 ${
                          plan.screens >= 2
                            ? selectedPlan === plan.id
                              ? 'text-primary'
                              : 'text-foreground'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                      <Tv
                        className={`h-5 w-5 ${
                          plan.screens >= 2
                            ? selectedPlan === plan.id
                              ? 'text-primary'
                              : 'text-foreground'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Selected Plan Summary */}
        <div className="mb-8 rounded-lg bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Plan {mockPlans.find(p => p.id === selectedPlan)?.name}
              </h3>
              <p className="text-muted-foreground">
                Q{mockPlans.find(p => p.id === selectedPlan)?.price}/mes
              </p>
            </div>
            <Button onClick={handleContinue} size="lg" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Continuar'}
            </Button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground text-center text-pretty">
          Al hacer clic en Continuar, aceptas los{' '}
          <Link href="#" className="text-primary hover:underline">
            Terminos de uso
          </Link>
          ,{' '}
          <Link href="#" className="text-primary hover:underline">
            Declaracion de privacidad
          </Link>{' '}
          y que tienes mas de 18 años. Quetxal TV renovara automaticamente tu membresia y te
          cobrara el precio de la membresia (actualmente Q
          {mockPlans.find(p => p.id === selectedPlan)?.price}/mes) a tu metodo de pago de forma
          mensual hasta que la canceles.
        </p>
      </main>
    </div>
  )
}
