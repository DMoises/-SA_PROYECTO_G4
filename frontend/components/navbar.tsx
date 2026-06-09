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

const navLinks = [
  { href: '/browse', label: 'Inicio' },
  { href: '/browse/series', label: 'Series' },
  { href: '/browse/movies', label: 'Peliculas' },
  { href: '/browse/new', label: 'Novedades' },
  { href: '/browse/my-list', label: 'Mi Lista' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileInitial, setProfileInitial] = useState('?')

  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')
    if (stored) {
      try {
        const { nombre } = JSON.parse(stored)
        setProfileInitial(nombre.charAt(0).toUpperCase())
      } catch {
        // ignore malformed data
      }
    }
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
              <div className="h-8 w-8 overflow-hidden rounded bg-gradient-to-br from-primary to-primary/60">
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary-foreground">
                  {profileInitial}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card">
              <DropdownMenuItem render={<Link href="/profiles" />}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-blue-700" />
                  <span>Maria</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/profiles" />}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-green-500 to-green-700" />
                  <span>Kids</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/profiles/manage" />}>
                Administrar perfiles
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account" />}>
                Cuenta
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/plans" />}>
                Mi suscripcion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/login" />}>
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}
