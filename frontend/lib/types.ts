export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Profile {
  id: string
  userId: string
  name: string
  avatar: string
  isKid: boolean
}

export interface Content {
  id: string
  title: string
  type: 'movie' | 'series'
  thumbnail: string
  backdrop: string
  year: number
  rating: string
  duration?: string
  seasons?: number
  episodes?: number
  genres: string[]
  description: string
  cast: CastMember[]
  director?: string
  matchPercentage: number
  isNew?: boolean
  isTrending?: boolean
  trailerUrl?: string
}

export interface CastMember {
  id: string
  name: string
  character: string
  photo: string
}

export interface Episode {
  id: string
  seriesId: string
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  duration: string
  thumbnail: string
}

export interface WatchProgress {
  contentId: string
  profileId: string
  progress: number
  lastWatched: Date
  episodeId?: string
  seasonNumber?: number
  episodeNumber?: number
}

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  features: string[]
  quality: string
  screens: number
  downloads: boolean
}

export interface Rating {
  id: string
  contentId: string
  profileId: string
  type: 'thumbs' | 'stars'
  value: number
}
