const DESTINATION_IMAGES = [
  {
    match: /cabo de la vela|guajira/i,
    url: 'https://images.unsplash.com/photo-1644849823235-7d3d55172383?w=1000&q=82',
    source: 'https://unsplash.com/es/fotos/una-estructura-oxidada-sentada-en-la-cima-de-una-colina-rocosa-ufy7_XhWdM4',
    credit: 'Foto de Cabo de la Vela · Unsplash',
  },
  {
    match: /ciudad perdida/i,
    url: 'https://images.unsplash.com/photo-1612442560597-393c75377041?w=1000&q=82',
    source: 'https://unsplash.com/photos/green-trees-on-mountain-during-daytime-RGpGqhjJKgo',
    credit: 'Paisaje de Ciudad Perdida · Unsplash',
  },
  {
    match: /tayrona/i,
    url: 'https://images.unsplash.com/photo-1635079552384-dd8adecd8a7c?w=1000&q=82',
    source: 'https://unsplash.com/photos/a-sandy-beach-with-palm-trees-and-people-swimming-in-the-water-gdtcSQi7B1E',
    credit: 'Playa del Tayrona · Unsplash',
  },
  {
    match: /cocora|café|cafe/i,
    url: 'https://images.unsplash.com/photo-1737914692165-b0428cca0104?w=1000&q=82',
    source: 'https://unsplash.com/photos/a-forest-filled-with-lots-of-trees-covered-in-mist-cgsKULFb3E8',
    credit: 'Valle del Cocora · Unsplash',
  },
  {
    match: /bahía solano|bahia solano|ballenas/i,
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Humpback_whale_breaching_off_the_coast_of_Choco,_Colombia.jpg?width=1000',
    source: 'https://commons.wikimedia.org/wiki/File:Humpback_whale_breaching_off_the_coast_of_Choco,_Colombia.jpg',
    credit: 'Foto: Dwayne Reilander · CC BY-SA 4.0',
  },
  {
    match: /caño cristales|cano cristales|macarena/i,
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/CA%C3%91O_CRISTALES_EL_R%C3%8DO_DE_LOS_CINCO_COLORES.jpg?width=1000',
    source: 'https://commons.wikimedia.org/wiki/File:CA%C3%91O_CRISTALES_EL_R%C3%8DO_DE_LOS_CINCO_COLORES.jpg',
    credit: 'Foto: Mario Carvajal · CC BY 3.0',
  },
  {
    match: /flamencos|kayak/i,
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flamencos_en_La_Guajira.jpg?width=1000',
    source: 'https://commons.wikimedia.org/wiki/File:Flamencos_en_La_Guajira.jpg',
    credit: 'Foto: John Eduar Pérez · CC BY-SA 4.0',
  },
]

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1612442560597-393c75377041?w=1000&q=82'

function getPhoto(experiencia) {
  const photos = experiencia?.fotos ?? []
  return photos.find((photo) => photo?.es_principal && photo?.url_foto)
    ?? photos.find((photo) => photo?.url_foto)
}

export function getExperienceImageInfo(experiencia) {
  const destination = DESTINATION_IMAGES.find(({ match }) => match.test(experiencia?.titulo ?? ''))
  const photo = getPhoto(experiencia)
  const url = photo?.url_foto ?? destination?.url
  if (!url) return { url: FALLBACK_IMAGE, credit: 'Paisaje colombiano · Unsplash', source: 'https://unsplash.com/license' }
  if (destination && (url.includes('commons.wikimedia.org') || url === destination.url)) return { ...destination, url }
  return { url }
}

export function getExperienceImage(experiencia) {
  return getExperienceImageInfo(experiencia).url
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

export const EXPERIENCE_IMAGE_FALLBACK = FALLBACK_IMAGE
