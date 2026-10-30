const CATEGORY_IMAGES = [
  { match: /sender|monta|trek|caminat/i, url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1000&q=82' },
  { match: /ave|bird|fauna/i, url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&q=82' },
  { match: /kayak|agua|rio|río|rafting/i, url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1000&q=82' },
  { match: /gastronom|cocina|comida/i, url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1000&q=82' },
  { match: /cultura|patrimonio|artesan/i, url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&q=82' },
]

export function getExperienceImage(experiencia) {
  const photos = experiencia?.fotos ?? []
  const primary = photos.find((photo) => photo?.es_principal && photo?.url_foto)
  const first = photos.find((photo) => photo?.url_foto)
  if (primary || first) return primary?.url_foto ?? first.url_foto

  return CATEGORY_IMAGES.find(({ match }) => match.test(experiencia?.categoriaNombre ?? ''))?.url
    ?? 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000&q=82'
}

export function getExperienceImageSrcSet(source) {
  if (!source) return undefined
  try {
    const url = new URL(source)
    if (url.hostname !== 'images.unsplash.com' || !url.pathname.includes('/photo-')) return undefined
    return [480, 800, 1200]
      .map((width) => {
        const variant = new URL(url)
        variant.searchParams.set('w', String(width))
        return `${variant.toString()} ${width}w`
      })
      .join(', ')
  } catch {
    return undefined
  }
}

export const EXPERIENCE_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000&q=82'
