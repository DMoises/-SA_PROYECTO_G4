'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Monitor, Smartphone, Tablet, Tv } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getPlans,
  getPlanPrice,
  createSubscription,
  getMySubscription,
  changeSubscription,
  cancelSubscription,
} from '@/lib/api/billing'

type Plan = {
  id: string
  name: string
  price: string
  basePrice: number
  monedaBase: string
  quality: string
  screens: number
  downloads: boolean
}

export default function PlansPage() {
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState('')
  const [currency, setCurrency] = useState('GTQ')
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan)
  const currentPlanData = plans.find(plan => plan.id === currentPlanId)

  const handleContinue = async () => {
    if (!selectedPlanData) {
      return
    }

    if (selectedPlan === currentPlanId) {
      setError('Ya tienes este plan activo.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      if (currentPlanId) {
        const response = await changeSubscription(
          selectedPlanData.id,
          selectedPlanData.basePrice,
          selectedPlanData.monedaBase,
          1
        )

        setMessage(response?.mensaje || 'Plan cambiado correctamente.')
      } else {
        const response = await createSubscription(
          selectedPlanData.id,
          selectedPlanData.basePrice,
          selectedPlanData.monedaBase,
          1
        )

        setMessage(response?.mensaje || 'Suscripción creada correctamente.')
      }

      setCurrentPlanId(selectedPlanData.id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo procesar la suscripción.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentPlanId) {
      return
    }

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar tu suscripción actual?'
    )

    if (!confirmed) {
      return
    }

    setIsCancelling(true)
    setMessage('')
    setError('')

    try {
      const response = await cancelSubscription()

      setCurrentPlanId(null)

      const nextPlanId =
        plans.find(plan => plan.id !== currentPlanId)?.id ||
        plans[0]?.id ||
        ''

      setSelectedPlan(nextPlanId)

      setMessage(
        response?.mensaje || 'Suscripción cancelada correctamente.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cancelar la suscripción.'
      )
    } finally {
      setIsCancelling(false)
    }
  }

  useEffect(() => {
    async function loadPlans() {
      setIsLoadingPlans(true)
      setMessage('')
      setError('')

      try {
        const data = await getPlans()

        const mappedPlans: Plan[] = await Promise.all(
          data.map(async (plan: any) => {
            const priceData = await getPlanPrice(plan.id, currency)

            return {
              id: plan.id,
              name: plan.nombre_plan,
              price: Number(priceData.precio_convertido).toFixed(2),
              basePrice: Number(plan.precio_base),
              monedaBase: plan.moneda_base,
              quality:
                plan.nombre_plan === 'Basico'
                  ? 'HD'
                  : plan.nombre_plan === 'Estandar'
                    ? 'Full HD'
                    : 'Ultra HD',
              screens:
                plan.nombre_plan === 'Basico'
                  ? 1
                  : plan.nombre_plan === 'Estandar'
                    ? 2
                    : 4,
              downloads: plan.nombre_plan === 'Premium',
            }
          })
        )

        setPlans(mappedPlans)

        const subscription = await getMySubscription()
        const profilesRes = await fetch('/api/profiles')
        if (profilesRes.ok) {
          const pData = await profilesRes.json()
          const allProfiles = Array.isArray(pData) ? pData : pData.perfiles || []
          const stored = localStorage.getItem('selectedProfile')
          let currentId: string | null = null;
          if (stored) {
            try { currentId = JSON.parse(stored).id } catch {}
          }
          if (currentId && allProfiles.length > 0 && currentId !== allProfiles[0].id) {
            router.push('/account')
            return
          }
        }

        const sub = await getMySubscription()

        if (subscription?.plan_id) {
          setCurrentPlanId(subscription.plan_id)
          setSelectedPlan(subscription.plan_id)
        } else {
          setCurrentPlanId(null)

          setSelectedPlan(previousPlanId => {
            const planStillExists = mappedPlans.some(
              plan => plan.id === previousPlanId
            )

            if (planStillExists) {
              return previousPlanId
            }

            return mappedPlans[0]?.id || ''
          })
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los planes.'
        )
      } finally {
        setIsLoadingPlans(false)
      }
    }

    loadPlans()
  }, [currency])

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border/30 px-4 py-6 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-primary md:text-3xl">
            QUETXAL
          </span>

          <span className="text-2xl font-light text-foreground md:text-3xl">
            TV
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Regresar
          </Button>

          <Link
            href="/login"
            className="text-sm font-semibold text-foreground hover:underline"
          >
            Cerrar sesión
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
          Paso 1 de 3
        </p>

        <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          Elige el plan ideal para ti
        </h1>

        <p className="mb-8 text-lg text-muted-foreground">
          Cambia o cancela en cualquier momento.
        </p>

        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Escoge tu moneda
            </h2>

            <p className="text-sm text-muted-foreground">
              Los precios se mostrarán en la moneda seleccionada.
            </p>
          </div>

          <select
            value={currency}
            onChange={event => setCurrency(event.target.value)}
            disabled={isLoadingPlans}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground disabled:opacity-50"
          >
            <option value="GTQ">GTQ - Quetzales</option>
            <option value="USD">USD - Dólares</option>
            <option value="MXN">MXN - Pesos mexicanos</option>
            <option value="EUR">EUR - Euros</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-4 text-base font-semibold text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 px-5 py-4 text-base font-semibold text-green-600">
            {message}
          </div>
        )}

        {isLoadingPlans && (
          <div className="mb-6 rounded-lg border border-border bg-card px-5 py-4 text-base font-semibold text-muted-foreground">
            Cargando precios en {currency}...
          </div>
        )}

        {currentPlanData && (
          <div className="mb-8 flex flex-col gap-5 rounded-lg border border-primary/40 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">
                Suscripción actual
              </p>

              <h2 className="text-2xl font-bold text-foreground">
                Plan {currentPlanData.name}
              </h2>

              <p className="mt-1 text-muted-foreground">
                Tu suscripción se encuentra activa.
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling || isLoading}
            >
              {isCancelling
                ? 'Cancelando...'
                : 'Cancelar suscripción'}
            </Button>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            'Sin compromisos, cancela cuando quieras',
            'Todo Quetxal TV a un bajo precio',
            'Sin anuncios ni interrupciones',
            'Mira en cualquier dispositivo',
          ].map(feature => (
            <div
              key={feature}
              className="flex items-center gap-3 rounded-lg bg-card p-4"
            >
              <Check className="h-6 w-6 text-primary" />

              <span className="text-sm text-foreground">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="p-4 text-left" />

                {plans.map(plan => (
                  <th key={plan.id} className="p-2">
                    {currentPlanId === plan.id && (
                      <div className="mb-2 text-xs font-semibold text-primary">
                        Plan actual
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan.id)
                        setMessage('')
                        setError('')
                      }}
                      disabled={
                        isLoadingPlans ||
                        isLoading ||
                        isCancelling
                      }
                      className={`w-full rounded-lg p-4 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedPlan === plan.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-card-foreground hover:bg-accent'
                      }`}
                    >
                      <div className="text-lg font-bold">
                        {plan.name}
                      </div>

                      <div className="text-2xl font-bold">
                        {currency} {plan.price}
                        <span className="text-sm font-normal">
                          /mes
                        </span>
                      </div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-4 text-muted-foreground">
                  Calidad de video
                </td>

                {plans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    <span
                      className={`font-medium ${
                        selectedPlan === plan.id
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {plan.quality}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-muted-foreground">
                  Pantallas simultáneas
                </td>

                {plans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    <span
                      className={`font-medium ${
                        selectedPlan === plan.id
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {plan.screens}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-muted-foreground">
                  Descargas
                </td>

                {plans.map(plan => (
                  <td key={plan.id} className="p-4 text-center">
                    {plan.downloads ? (
                      <Check
                        className={`mx-auto h-5 w-5 ${
                          selectedPlan === plan.id
                            ? 'text-primary'
                            : 'text-green-500'
                        }`}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        -
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-muted-foreground">
                  Dispositivos
                </td>

                {plans.map(plan => (
                  <td key={plan.id} className="p-4">
                    <div className="flex justify-center gap-2">
                      {[Smartphone, Tablet, Monitor, Tv].map(
                        (Icon, index) => {
                          const enabled =
                            index === 0 || plan.screens >= 2

                          return (
                            <Icon
                              key={index}
                              className={`h-5 w-5 ${
                                enabled
                                  ? selectedPlan === plan.id
                                    ? 'text-primary'
                                    : 'text-foreground'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          )
                        }
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8 rounded-lg bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {selectedPlanData
                  ? `Plan ${selectedPlanData.name}`
                  : 'Selecciona un plan'}
              </h3>

              {selectedPlanData && (
                <p className="text-muted-foreground">
                  {currency} {selectedPlanData.price}/mes
                </p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              size="lg"
              disabled={
                isLoading ||
                isCancelling ||
                isLoadingPlans ||
                selectedPlan === currentPlanId ||
                !selectedPlanData
              }
            >
              {selectedPlan === currentPlanId
                ? 'Plan actual'
                : isLoading
                  ? 'Procesando...'
                  : currentPlanId
                    ? 'Cambiar plan'
                    : 'Suscribirse'}
            </Button>
          </div>
        </div>

        <p className="text-pretty text-center text-xs text-muted-foreground">
          Al hacer clic en Suscribirse o Cambiar plan, aceptas los{' '}

          <Link href="#" className="text-primary hover:underline">
            Términos de uso
          </Link>

          ,{' '}

          <Link href="#" className="text-primary hover:underline">
            Declaración de privacidad
          </Link>{' '}

          y que tienes más de 18 años. Quetxal TV renovará automáticamente tu
          membresía y te cobrará el precio mensual correspondiente hasta que la
          canceles.
        </p>
      </main>
    </div>
  )
}