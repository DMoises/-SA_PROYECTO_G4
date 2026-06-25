'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronDown, Menu, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

const navLinks = [
  { href: '/browse', label: 'Inicio' },
  { href: '/browse/series', label: 'Series' },
  { href: '/browse/movies', label: 'Peliculas' },
  { href: '/browse/new', label: 'Novedades' },
  { href: '/watchparty', label: 'Watch Party' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')
  const [otherProfiles, setOtherProfiles] = useState<any[]>([])
  const [profileColor, setProfileColor] = useState('from-primary to-primary/70')
  const [isMainProfile, setIsMainProfile] = useState(false)
  // Los perfiles infantiles no pueden administrar perfiles, cuenta ni suscripcion.
  const [isKidsProfile, setIsKidsProfile] = useState(false)

  const profileColors = [
    'from-primary to-primary/70',
    'from-blue-500 to-blue-700',
    'from-green-500 to-green-700',
    'from-yellow-500 to-yellow-700',
    'from-purple-500 to-purple-700',
  ]

  const handleProfileSelect = (profile: any) => {
    const esInfantil = profile.es_infantil ?? profile.esInfantil ?? false
    localStorage.setItem(
      'selectedProfile',
      JSON.stringify({ id: profile.id, nombre: profile.nombre, esInfantil }),
    )
    window.location.href = '/browse'
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  useEffect(() => {
    let currentId: string | null = null;
    const stored = localStorage.getItem('selectedProfile')
    if (stored) {
      try {
        const { nombre, id } = JSON.parse(stored)
        setProfileInitial(nombre.charAt(0).toUpperCase())
        currentId = id;
      } catch {
        // ignore malformed data
      }
    }

    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        const allProfiles = Array.isArray(data) ? data : (data.perfiles || []);
        if (allProfiles.length > 0 && currentId === allProfiles[0].id) {
          setIsMainProfile(true);
        }
        if (currentId) {
          const currentIndex = allProfiles.findIndex((p: any) => p.id === currentId)
          if (currentIndex !== -1) {
            setProfileColor(profileColors[currentIndex % profileColors.length])
            const actual = allProfiles[currentIndex]
            setIsKidsProfile(actual?.es_infantil ?? actual?.esInfantil ?? false)
          }
          setOtherProfiles(allProfiles.map((p: any, index: number) => ({...p, originalIndex: index})).filter((p: any) => p.id !== currentId));
        } else {
          setOtherProfiles(allProfiles.map((p: any, index: number) => ({...p, originalIndex: index})));
        }
      })
      .catch(console.error);
  }, [])

  return (
    <header className="fixed top-0 z-50 w-full bg-gradient-to-b from-background/90 to-transparent">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 lg:px-16">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/browse" className="flex items-center">
            <span className="text-2xl font-bold text-primary md:text-3xl">QUETXAL</span>
            <span className="text-2xl font-light text-foreground md:text-3xl">TV</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  pathname === link.href ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "md:hidden gap-1 text-sm")}>
              Explorar <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card">
              {navLinks.map(link => (
                <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-foreground transition-colors hover:text-muted-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Link>

          <button className="relative text-foreground transition-colors hover:text-muted-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              3
            </span>
            <span className="sr-only">Notificaciones</span>
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "gap-2 p-0")}>
              <div className={`h-8 w-8 overflow-hidden rounded bg-gradient-to-br ${profileColor}`}>
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {profileInitial}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card">
              {otherProfiles.map((profile, i) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br ${
                      profileColors[profile.originalIndex % profileColors.length]
                    } text-sm font-bold text-white`}>
                      {profile.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span>{profile.nombre}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {/* Los perfiles infantiles no acceden a administracion de cuenta/perfiles. */}
              {!isKidsProfile && (
                <>
                  <DropdownMenuItem render={<Link href="/profiles/manage" />}>
                    Administrar perfiles
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account" />}>
                    Cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account/plans" />}>
                    Mi suscripcion
                  </DropdownMenuItem>
                  {user?.rol === 'admin' && (
                    <DropdownMenuItem render={<Link href="/admin" />}>
                      Panel de administración
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
