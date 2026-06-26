'use client'

import { useAdminGuard } from '@/lib/use-admin-guard'

// Toda la seccion de cuenta (datos personales, pagos, planes, seguridad) queda
// reservada al perfil administrador (principal): a los demas se les redirige a
// /browse.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAdminGuard()
  return <>{children}</>
}
