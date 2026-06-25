'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirige a /browse si el perfil ACTIVO es infantil.
 *
 * Los perfiles infantiles no pueden administrar perfiles, ver la cuenta ni la
 * suscripcion. El perfil activo vive en localStorage (selectedProfile); como
 * puede no traer aun el flag esInfantil (sesiones previas), confirmamos contra
 * el backend (/api/profiles, que serializa es_infantil en snake_case).
 */
export function useKidsGuard() {
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

    // Camino rapido: si ya guardamos el flag al seleccionar el perfil.
    if (perfil?.esInfantil === true) {
      router.replace('/browse')
      return
    }
    if (perfil?.esInfantil === false) return
    if (!perfil?.id) return

    // Respaldo: lo determinamos contra el backend.
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        const todos = Array.isArray(data) ? data : data?.perfiles || []
        const actual = todos.find((p: any) => p.id === perfil.id)
        const esInfantil = actual?.es_infantil ?? actual?.esInfantil ?? false
        if (esInfantil) router.replace('/browse')
      })
      .catch(() => {})
  }, [router])
}
