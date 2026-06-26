'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirige a /browse si el perfil ACTIVO no es el administrador.
 *
 * El administrador es el perfil PRINCIPAL: el creado durante el registro, que
 * es el primero que devuelve /api/profiles (el backend ordena por creado_en).
 * Solo ese perfil puede administrar perfiles, ver la cuenta y la suscripcion.
 */
export function useAdminGuard() {
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')
    if (!stored) return

    let perfil: any = null
    try {
      perfil = JSON.parse(stored)
    } catch {
      return
    }
    if (!perfil?.id) return

    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        const todos = Array.isArray(data) ? data : data?.perfiles || []
        if (todos.length === 0) return
        // El primero (mas antiguo) es el administrador.
        if (todos[0].id !== perfil.id) {
          router.replace('/browse')
        }
      })
      .catch(() => {})
  }, [router])
}
