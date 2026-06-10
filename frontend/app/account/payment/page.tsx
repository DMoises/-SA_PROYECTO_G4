'use client'

import Link from 'next/link'
import { ArrowLeft, CreditCard, Wrench } from 'lucide-react'
import { Navbar } from '@/components/navbar'

export default function PaymentPage() {
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

        <h1 className="mb-8 text-3xl font-bold text-foreground">Métodos de pago</h1>

        <div className="rounded-lg bg-card p-12 flex flex-col items-center justify-center text-center gap-6">
          <div className="relative">
            <CreditCard className="h-20 w-20 text-muted-foreground/40" />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-yellow-500 p-1.5">
              <Wrench className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Página en construcción</h2>
            <p className="text-muted-foreground">
              La gestión de métodos de pago estará disponible próximamente.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
