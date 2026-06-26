'use client'

import { useEffect, useState } from 'react'
import { ContentCarousel } from '@/components/content-carousel'
import { Content } from '@/lib/types'

/**
 * Motor de Recomendación – Sección "Recomendados para ti"
 *
 * Consulta el endpoint /api/catalog/recommendations con el perfil_id
 * almacenado en localStorage. El backend aplica un algoritmo de
 * Content-Based Filtering (basado en géneros) analizando el historial
 * de reproducción y las calificaciones positivas del perfil.
 */
export function RecommendedForYou() {
  const [recommendations, setRecommendations] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('selectedProfile')
    if (!stored) {
      setLoading(false)
      return
    }

    try {
      const profile = JSON.parse(stored)
      if (profile?.id) {
        fetchRecommendations(profile.id)
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  const fetchRecommendations = async (perfilId: string) => {
    try {
      const res = await fetch(`/api/catalog/recommendations?perfil_id=${encodeURIComponent(perfilId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setRecommendations(data)
        }
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || recommendations.length === 0) {
    return null
  }

  return <ContentCarousel title="Recomendados para ti" contents={recommendations} />
}
