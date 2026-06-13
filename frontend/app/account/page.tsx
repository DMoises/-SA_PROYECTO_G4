'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, CreditCard, Shield, LogOut, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { getMySubscription, getPlans } from '@/lib/api/billing'
import { useAuth } from '@/lib/auth-context'

type Plan = {
  id: string
  nombre_plan: string
  precio_base: number
  moneda_base: string
}

type Subscription = {
  plan_id: string
}

export default function AccountPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [perfiles, setPerfiles] = useState<{id: string, nombre: string}[]>([])
  const [isMainProfile, setIsMainProfile] = useState(false)
  const [mainProfileId, setMainProfileId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function loadAccount() {
      try {
        const sub = await getMySubscription()
        const plans = await getPlans()

        setSubscription(sub)

        if (sub?.plan_id) {
          const plan = plans.find((p: Plan) => p.id === sub.plan_id)
          setCurrentPlan(plan || null)
        }
      } catch {
        setError('No se pudo cargar tu membresía.')
      }

      try {
        const res = await fetch('/api/profiles')
        if (res.ok) {
          const data = await res.json()
          const allProfiles = Array.isArray(data) ? data : data.perfiles || []
          setPerfiles(allProfiles)
          
          const stored = localStorage.getItem('selectedProfile')
          let currentId: string | null = null;
          if (stored) {
            try { currentId = JSON.parse(stored).id } catch {}
          }
          if (currentId && allProfiles.length > 0 && currentId === allProfiles[0].id) {
            setIsMainProfile(true)
            setMainProfileId(allProfiles[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching profiles', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAccount()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-16 md:px-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Cuenta</h1>

        <div className="space-y-6">
          <section className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Membresía y facturación
              </h2>

              {isMainProfile && (
                <Link href="/account/plans">
                  <Button variant="outline" size="sm">
                    Cambiar plan
                  </Button>
                </Link>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-foreground">
                    Correo: {user?.email || 'Cargando...'}
                  </p>
                  <p className="text-sm text-muted-foreground">Contraseña: ********</p>
                </div>

                {isMainProfile && (
                  <Link href="#" className="text-sm text-primary hover:underline">
                    Cambiar email
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {isLoading ? (
                    <>
                      <p className="text-foreground">Cargando membresía...</p>
                      <p className="text-sm text-muted-foreground">Espere un momento</p>
                    </>
                  ) : subscription && currentPlan ? (
                    <>
                      <p className="text-foreground">
                        Plan {currentPlan.nombre_plan}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentPlan.moneda_base} {Number(currentPlan.precio_base).toFixed(2)}/mes
                      </p>
                    </>
                  ) : subscription && !currentPlan ? (
                    <>
                      <p className="text-foreground">Plan actual no encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        ID del plan: {subscription.plan_id}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-foreground">Sin membresía activa</p>
                      <p className="text-sm text-muted-foreground">
                        Elige un plan para comenzar
                      </p>
                    </>
                  )}
                </div>

                {isMainProfile && (
                  <Link href="/account/plans" className="text-sm text-primary hover:underline">
                    {subscription ? 'Cambiar plan' : 'Elegir plan'}
                  </Link>
                )}
              </div>
            </div>
          </section>

          {isMainProfile && (
            <section className="rounded-lg bg-card">
              <Link
                href={`/account/personal${mainProfileId ? `?profileId=${mainProfileId}` : ''}`}
                className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Información personal</p>
                    <p className="text-sm text-muted-foreground">
                      Nombre del perfil
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>

              <Link
                href="/account/payment"
                className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Métodos de pago</p>
                    <p className="text-sm text-muted-foreground">Actualiza tu información de pago</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>

              <Link
                href="/account/security"
                className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Seguridad y privacidad</p>
                    <p className="text-sm text-muted-foreground">
                      Contraseña, sesiones activas, datos
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            </section>
          )}

          <section className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Perfiles</h2>
              {isMainProfile && (
                <Link href="/profiles/manage" className="text-sm text-primary hover:underline">
                  Administrar perfiles
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {perfiles.map((perfil, i) => (
                <div key={perfil.id} className="flex flex-col items-center">
                  <div
                    className={`h-16 w-16 rounded bg-gradient-to-br ${
                      i % 3 === 0
                        ? 'from-primary to-primary/70'
                        : i % 3 === 1
                          ? 'from-blue-500 to-blue-700'
                          : 'from-green-500 to-green-700'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                      {perfil.nombre.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <span className="mt-2 text-sm text-muted-foreground">{perfil.nombre}</span>
                </div>
              ))}
            </div>
          </section>

          <Link
            href="/login"
            className="flex items-center gap-4 rounded-lg bg-card p-4 text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesión en todos los dispositivos</span>
          </Link>
        </div>
      </main>
    </div>
  )
}