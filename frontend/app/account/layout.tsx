'use client'

import { useKidsGuard } from '@/lib/use-kids-guard'

// Toda la seccion de cuenta (datos personales, pagos, planes, seguridad) queda
// vedada para perfiles infantiles: se les redirige a /browse.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useKidsGuard()
  return <>{children}</>
}
