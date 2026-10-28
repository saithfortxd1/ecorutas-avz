import api from '../api/axiosClient.js'
import { cache } from '../utils/cache.js'
import { normalizeCategoria } from '../models/Categoria.js'

const PREFIX = 'categorias'
const TTL = 5 * 60_000 // 5 min

function toArray(data) {
  return Array.isArray(data) ? data : data?.results ?? []
}

/**
 * GET /api/catalogo/categorias/ con caché en memoria.
 * Las llamadas repetidas se resuelven al instante desde la caché.
 */
export function listCategorias({ force = false } = {}) {
  return cache.getOrSet(
    `${PREFIX}:all`,
    () => api.get('/catalogo/categorias/').then(({ data }) => toArray(data).map(normalizeCategoria)),
    { ttl: TTL, force },
  )
}

export function invalidateCategorias() {
  cache.invalidatePrefix(PREFIX)
}
