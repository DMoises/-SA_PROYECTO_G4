'use client'

import Link from 'next/link'
import { User, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-16 md:px-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Cuenta</h1>

        <div className="space-y-6">
          {/* Membership Section */}
          <section className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Membresia y facturacion</h2>
              <Link href="/account/plans">
                <Button variant="outline" size="sm">
                  Cambiar plan
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-foreground">usuario@ejemplo.com</p>
                  <p className="text-sm text-muted-foreground">Contraseña: ********</p>
                </div>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Cambiar email
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">Plan Estandar</p>
                  <p className="text-sm text-muted-foreground">Q89/mes</p>
                </div>
                <Link href="/account/plans" className="text-sm text-primary hover:underline">
                  Cambiar plan
                </Link>
              </div>
            </div>
          </section>

          {/* Settings Menu */}
          <section className="rounded-lg bg-card">
            <Link
              href="#"
              className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Informacion personal</p>
                  <p className="text-sm text-muted-foreground">Nombre, telefono, fecha de nacimiento</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="#"
              className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Metodos de pago</p>
                  <p className="text-sm text-muted-foreground">Actualiza tu informacion de pago</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="#"
              className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Notificaciones</p>
                  <p className="text-sm text-muted-foreground">Configura tus preferencias de comunicacion</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="#"
              className="flex items-center justify-between border-b border-border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Seguridad y privacidad</p>
                  <p className="text-sm text-muted-foreground">Contraseña, sesiones activas, datos</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link
              href="#"
              className="flex items-center justify-between p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Centro de ayuda</p>
                  <p className="text-sm text-muted-foreground">Preguntas frecuentes y soporte</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </section>

          {/* Profiles Section */}
          <section className="rounded-lg bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Perfiles</h2>
              <Link href="/profiles" className="text-sm text-primary hover:underline">
                Administrar perfiles
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {['Ricardo', 'Maria', 'Kids'].map((name, i) => (
                <div key={name} className="flex flex-col items-center">
                  <div className={`h-16 w-16 rounded bg-gradient-to-br ${
                    i === 0 ? 'from-primary to-primary/70' :
                    i === 1 ? 'from-blue-500 to-blue-700' :
                    'from-green-500 to-green-700'
                  }`}>
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                      {name.charAt(0)}
                    </div>
                  </div>
                  <span className="mt-2 text-sm text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sign Out */}
          <Link
            href="/login"
            className="flex items-center gap-4 rounded-lg bg-card p-4 text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesion en todos los dispositivos</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
