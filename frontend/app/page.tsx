import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/quetxal-hero/1920/1080"
            alt="Quetxal TV"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 py-6 md:px-8 lg:px-16">
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold text-primary md:text-4xl">QUETXAL</span>
            <span className="text-3xl font-light text-foreground md:text-4xl">TV</span>
          </Link>
          <Link href="/login">
            <Button variant="default" size="sm">
              Iniciar sesion
            </Button>
          </Link>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 max-w-4xl text-4xl font-bold text-foreground md:text-5xl lg:text-6xl text-balance">
            Peliculas y series ilimitadas y mucho mas
          </h1>
          <p className="mb-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Disfruta donde quieras. Cancela en cualquier momento.
          </p>
          <p className="mb-6 text-lg text-foreground">
            ¿Quieres ver algo ya? Ingresa tu email para crear una cuenta o reiniciar tu membresia.
          </p>

          {/* Email CTA */}
          <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Correo electronico"
              className="h-14 flex-1 rounded-md bg-input px-4 text-foreground placeholder:text-muted-foreground"
            />
            <Link href="/register">
              <Button size="lg" className="h-14 w-full gap-2 text-lg sm:w-auto">
                Comenzar
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="border-t-8 border-border bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Disfruta en tu TV
              </h2>
              <p className="text-lg text-muted-foreground">
                Mira en smart TVs, PlayStation, Xbox, Chromecast, Apple TV, reproductores de
                Blu-ray y mas.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://picsum.photos/seed/tv-feature/600/400"
                alt="TV"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-8 border-border bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <img
                src="https://picsum.photos/seed/download-feature/600/400"
                alt="Download"
                className="w-full rounded-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Descarga tus series para verlas offline
              </h2>
              <p className="text-lg text-muted-foreground">
                Guarda tu contenido favorito y ten siempre algo para ver.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-8 border-border bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Mira donde quieras
              </h2>
              <p className="text-lg text-muted-foreground">
                Disfruta en tu telefono, tablet, laptop y TV sin pagar mas.
              </p>
            </div>
            <div>
              <img
                src="https://picsum.photos/seed/devices-feature/600/400"
                alt="Devices"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t-8 border-border bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <img
                src="https://picsum.photos/seed/kids-feature/600/400"
                alt="Kids"
                className="w-full rounded-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Crea perfiles para ninos
              </h2>
              <p className="text-lg text-muted-foreground">
                Los ninos disfrutaran aventuras con sus personajes favoritos en un espacio hecho
                para ellos, sin costo adicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t-8 border-border bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground md:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {[
              '¿Que es Quetxal TV?',
              '¿Cuanto cuesta Quetxal TV?',
              '¿Donde puedo ver?',
              '¿Como cancelo?',
              '¿Que puedo ver en Quetxal TV?',
              '¿Es bueno Quetxal TV para los ninos?',
            ].map(question => (
              <details
                key={question}
                className="group rounded-lg bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 text-lg font-medium text-foreground">
                  {question}
                  <ChevronRight className="h-6 w-6 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 text-muted-foreground">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </details>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-lg text-foreground">
              ¿Quieres ver algo ya? Ingresa tu email para crear una cuenta o reiniciar tu membresia.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="Correo electronico"
                className="h-14 w-full rounded-md bg-input px-4 text-foreground placeholder:text-muted-foreground sm:max-w-md"
              />
              <Link href="/register">
                <Button size="lg" className="h-14 w-full gap-2 text-lg sm:w-auto">
                  Comenzar
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-muted-foreground">¿Preguntas? Llama al 1-800-QUETXAL</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
            <Link href="#" className="hover:underline">Preguntas frecuentes</Link>
            <Link href="#" className="hover:underline">Centro de ayuda</Link>
            <Link href="#" className="hover:underline">Cuenta</Link>
            <Link href="#" className="hover:underline">Prensa</Link>
            <Link href="#" className="hover:underline">Relaciones con inversionistas</Link>
            <Link href="#" className="hover:underline">Empleo</Link>
            <Link href="#" className="hover:underline">Formas de ver</Link>
            <Link href="#" className="hover:underline">Terminos de uso</Link>
            <Link href="#" className="hover:underline">Privacidad</Link>
            <Link href="#" className="hover:underline">Preferencias de cookies</Link>
            <Link href="#" className="hover:underline">Informacion corporativa</Link>
            <Link href="#" className="hover:underline">Contactanos</Link>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <span className="text-xl font-bold text-primary">QUETXAL</span>
            <span className="text-xl font-light text-foreground">TV</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © 2024 Quetxal TV. Proyecto universitario - Software Avanzado USAC.
          </p>
        </div>
      </footer>
    </div>
  )
}
