import { Content, Plan, Profile, Episode, CastMember } from './types'

export const mockProfiles: Profile[] = [
  { id: '1', userId: '1', name: 'Ricardo', avatar: '/avatars/avatar-1.png', isKid: false },
  { id: '2', userId: '1', name: 'Maria', avatar: '/avatars/avatar-2.png', isKid: false },
  { id: '3', userId: '1', name: 'Kids', avatar: '/avatars/avatar-3.png', isKid: true },
]

export const mockCast: CastMember[] = [
  { id: '1', name: 'Ana Martinez', character: 'Elena', photo: 'https://picsum.photos/seed/cast1/200/300' },
  { id: '2', name: 'Carlos Ruiz', character: 'Diego', photo: 'https://picsum.photos/seed/cast2/200/300' },
  { id: '3', name: 'Sofia Lopez', character: 'Carmen', photo: 'https://picsum.photos/seed/cast3/200/300' },
  { id: '4', name: 'Miguel Torres', character: 'Roberto', photo: 'https://picsum.photos/seed/cast4/200/300' },
  { id: '5', name: 'Laura Garcia', character: 'Patricia', photo: 'https://picsum.photos/seed/cast5/200/300' },
]

export const mockContent: Content[] = [
  {
    id: '1',
    title: 'El Reino Perdido',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie1/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop1/1920/1080',
    year: 2024,
    rating: 'PG-13',
    duration: '2h 15m',
    genres: ['Aventura', 'Fantasia', 'Accion'],
    description: 'Un joven descubre un antiguo mapa que lo lleva a un reino oculto donde la magia aun existe. Debera enfrentarse a criaturas miticas y descubrir su verdadero destino.',
    cast: mockCast,
    director: 'Alejandro Gonzalez',
    matchPercentage: 95,
    isNew: true,
    isTrending: true,
  },
  {
    id: '2',
    title: 'Cronicas del Futuro',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series1/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop2/1920/1080',
    year: 2024,
    rating: 'TV-MA',
    seasons: 3,
    episodes: 24,
    genres: ['Ciencia Ficcion', 'Drama', 'Thriller'],
    description: 'En un futuro distopico, un grupo de rebeldes lucha contra un gobierno totalitario que controla la mente de la poblacion. La resistencia comienza ahora.',
    cast: mockCast,
    matchPercentage: 92,
    isTrending: true,
  },
  {
    id: '3',
    title: 'Amor en Paris',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie2/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop3/1920/1080',
    year: 2023,
    rating: 'PG',
    duration: '1h 58m',
    genres: ['Romance', 'Comedia', 'Drama'],
    description: 'Dos almas perdidas se encuentran en la ciudad del amor. Lo que comienza como un encuentro casual se convierte en una historia de amor inolvidable.',
    cast: mockCast,
    director: 'Maria Fernandez',
    matchPercentage: 88,
  },
  {
    id: '4',
    title: 'El Detective',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series2/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop4/1920/1080',
    year: 2024,
    rating: 'TV-MA',
    seasons: 2,
    episodes: 16,
    genres: ['Crimen', 'Misterio', 'Thriller'],
    description: 'Un detective veterano con un pasado oscuro debe resolver una serie de crimenes que parecen estar conectados con su propia historia.',
    cast: mockCast,
    matchPercentage: 90,
    isNew: true,
  },
  {
    id: '5',
    title: 'Guerreros Antiguos',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie3/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop5/1920/1080',
    year: 2024,
    rating: 'R',
    duration: '2h 30m',
    genres: ['Accion', 'Historia', 'Drama'],
    description: 'La epica historia de un grupo de guerreros que defendieron su tierra natal contra invasores implacables. Una batalla por la libertad.',
    cast: mockCast,
    director: 'Roberto Mendez',
    matchPercentage: 87,
    isTrending: true,
  },
  {
    id: '6',
    title: 'Mundos Paralelos',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series3/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop6/1920/1080',
    year: 2023,
    rating: 'TV-14',
    seasons: 1,
    episodes: 10,
    genres: ['Ciencia Ficcion', 'Misterio', 'Aventura'],
    description: 'Una cientifica descubre una forma de viajar entre dimensiones paralelas, pero cada viaje tiene consecuencias impredecibles.',
    cast: mockCast,
    matchPercentage: 94,
    isNew: true,
  },
  {
    id: '7',
    title: 'La Ultima Mision',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie4/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop7/1920/1080',
    year: 2024,
    rating: 'PG-13',
    duration: '2h 10m',
    genres: ['Accion', 'Thriller', 'Espionaje'],
    description: 'Un agente retirado es llamado para una ultima mision que podria cambiar el curso de la historia mundial.',
    cast: mockCast,
    director: 'Juan Carlos Vega',
    matchPercentage: 89,
  },
  {
    id: '8',
    title: 'Cocina con Pasion',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series4/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop8/1920/1080',
    year: 2024,
    rating: 'TV-G',
    seasons: 5,
    episodes: 50,
    genres: ['Reality', 'Cocina', 'Competencia'],
    description: 'Los mejores chefs del pais compiten por el titulo de maestro culinario en esta emocionante competencia gastronomica.',
    cast: mockCast,
    matchPercentage: 85,
  },
  {
    id: '9',
    title: 'Terror Nocturno',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie5/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop9/1920/1080',
    year: 2024,
    rating: 'R',
    duration: '1h 45m',
    genres: ['Terror', 'Suspenso', 'Misterio'],
    description: 'Una familia se muda a una antigua mansion sin saber que algo oscuro habita en sus paredes. Las pesadillas se vuelven realidad.',
    cast: mockCast,
    director: 'Andrea Gomez',
    matchPercentage: 82,
    isNew: true,
  },
  {
    id: '10',
    title: 'Deportes Extremos',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series5/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop10/1920/1080',
    year: 2023,
    rating: 'TV-PG',
    seasons: 2,
    episodes: 20,
    genres: ['Documental', 'Deportes', 'Aventura'],
    description: 'Sigue a los atletas mas audaces del mundo mientras conquistan los deportes mas peligrosos del planeta.',
    cast: mockCast,
    matchPercentage: 91,
  },
  {
    id: '11',
    title: 'Comedia Central',
    type: 'movie',
    thumbnail: 'https://picsum.photos/seed/movie6/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop11/1920/1080',
    year: 2024,
    rating: 'PG-13',
    duration: '1h 52m',
    genres: ['Comedia', 'Romance'],
    description: 'Un comediante en crisis existencial descubre que el amor puede venir de los lugares mas inesperados.',
    cast: mockCast,
    director: 'Pedro Sanchez',
    matchPercentage: 86,
  },
  {
    id: '12',
    title: 'Naturaleza Salvaje',
    type: 'series',
    thumbnail: 'https://picsum.photos/seed/series6/400/600',
    backdrop: 'https://picsum.photos/seed/backdrop12/1920/1080',
    year: 2024,
    rating: 'TV-G',
    seasons: 1,
    episodes: 8,
    genres: ['Documental', 'Naturaleza'],
    description: 'Explora los ecosistemas mas remotos del planeta y descubre las increibles criaturas que los habitan.',
    cast: mockCast,
    matchPercentage: 96,
    isNew: true,
    isTrending: true,
  },
]

export const mockEpisodes: Episode[] = [
  { id: 'e1', seriesId: '2', seasonNumber: 1, episodeNumber: 1, title: 'El Despertar', description: 'La historia comienza cuando un extrano fenomeno despierta poderes ocultos en la poblacion.', duration: '52m', thumbnail: 'https://picsum.photos/seed/ep1/400/225' },
  { id: 'e2', seriesId: '2', seasonNumber: 1, episodeNumber: 2, title: 'La Revelacion', description: 'Los protagonistas descubren la verdad detras del gobierno y sus oscuros secretos.', duration: '48m', thumbnail: 'https://picsum.photos/seed/ep2/400/225' },
  { id: 'e3', seriesId: '2', seasonNumber: 1, episodeNumber: 3, title: 'Alianzas', description: 'Se forman alianzas inesperadas mientras la resistencia cobra fuerza.', duration: '55m', thumbnail: 'https://picsum.photos/seed/ep3/400/225' },
  { id: 'e4', seriesId: '2', seasonNumber: 1, episodeNumber: 4, title: 'La Traicion', description: 'Un miembro del grupo revela sus verdaderas intenciones.', duration: '50m', thumbnail: 'https://picsum.photos/seed/ep4/400/225' },
  { id: 'e5', seriesId: '2', seasonNumber: 1, episodeNumber: 5, title: 'El Asalto', description: 'El grupo planea un ataque arriesgado contra las instalaciones enemigas.', duration: '58m', thumbnail: 'https://picsum.photos/seed/ep5/400/225' },
]

export const mockPlans: Plan[] = [
  {
    id: 'basic',
    name: 'Basico',
    price: 49,
    currency: 'GTQ',
    features: ['1 pantalla a la vez', 'Calidad 720p', 'Ver en movil y tablet'],
    quality: '720p',
    screens: 1,
    downloads: false,
  },
  {
    id: 'standard',
    name: 'Estandar',
    price: 89,
    currency: 'GTQ',
    features: ['2 pantallas a la vez', 'Calidad Full HD 1080p', 'Ver en cualquier dispositivo', 'Descargas disponibles'],
    quality: '1080p',
    screens: 2,
    downloads: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 139,
    currency: 'GTQ',
    features: ['4 pantallas a la vez', 'Calidad 4K + HDR', 'Ver en cualquier dispositivo', 'Descargas disponibles', 'Audio espacial'],
    quality: '4K + HDR',
    screens: 4,
    downloads: true,
  },
]

export const genres = [
  'Todos',
  'Accion',
  'Aventura',
  'Ciencia Ficcion',
  'Comedia',
  'Crimen',
  'Documental',
  'Drama',
  'Fantasia',
  'Historia',
  'Misterio',
  'Romance',
  'Terror',
  'Thriller',
]

export function getContentByGenre(genre: string): Content[] {
  if (genre === 'Todos') return mockContent
  return mockContent.filter(content => content.genres.includes(genre))
}

export function getTrendingContent(): Content[] {
  return mockContent.filter(content => content.isTrending)
}

export function getNewContent(): Content[] {
  return mockContent.filter(content => content.isNew)
}

export function getMovies(): Content[] {
  return mockContent.filter(content => content.type === 'movie')
}

export function getSeries(): Content[] {
  return mockContent.filter(content => content.type === 'series')
}

export function getContentById(id: string): Content | undefined {
  return mockContent.find(content => content.id === id)
}

export function searchContent(query: string): Content[] {
  const lowerQuery = query.toLowerCase()
  return mockContent.filter(
    content =>
      content.title.toLowerCase().includes(lowerQuery) ||
      content.genres.some(genre => genre.toLowerCase().includes(lowerQuery)) ||
      content.description.toLowerCase().includes(lowerQuery)
  )
}
