'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return

    const isProtectedPath = 
      pathname.startsWith('/browse') || 
      pathname.startsWith('/profiles') || 
      pathname.startsWith('/account')

    const isAuthPath = 
      pathname === '/login' || 
      pathname === '/register'

    if (isProtectedPath && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthPath && isAuthenticated) {
      router.push('/profiles')
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Optionally, you can show a loading spinner while checking auth status on protected routes
  // But for now, we just return children to avoid layout jumping
  return <>{children}</>
}
