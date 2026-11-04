import api from '../api/axiosClient.js'
import { cache } from '../utils/cache.js'
import { normalizeExperiencia, experienciaToPayload } from '../models/Experiencia.js'

const PREFIX = 'experiencias'
const TTL = 30_000 // 30 s

function toArray(data) {
  return Array.isArray(data) ? data : data?.results ?? []
}

function buildParams(search, ordering) {
  const params = {}
  if (search) params.search = search
  if (ordering) params.ordering = ordering
  return params
}

/**
 * GET /api/catalogo/experiencias/ con caché por combinación de búsqueda+orden.
 * Repetir la misma consulta devuelve el resultado cacheado (respuesta inmediata).
 */
export function listExperiencias({ search = '', ordering = '' } = {}, { force = false } = {}) {
  const key = `${PREFIX}:list:${search}|${ordering}`
  return cache.getOrSet(
    key,
    () =>
      api
        .get('/catalogo/experiencias/', { params: buildParams(search, ordering) })
        .then(({ data }) => toArray(data).map(normalizeExperiencia)),
    { ttl: TTL, force },
  )
}

/** POST /api/catalogo/experiencias/ (solo anfitrión). */
export async function createExperiencia(form) {
  const { data } = await api.post('/catalogo/experiencias/', experienciaToPayload(form))
  cache.invalidatePrefix(PREFIX)
  return normalizeExperiencia(data)
}

/** PUT /api/catalogo/experiencias/{id}/ (solo el anfitrión propietario). */
export async function updateExperiencia(id, form) {
  const { data } = await api.put(`/catalogo/experiencias/${id}/`, experienciaToPayload(form))
  cache.invalidatePrefix(PREFIX)
  return normalizeExperiencia(data)
}

/** DELETE /api/catalogo/experiencias/{id}/ (solo el anfitrión propietario). */
export async function deleteExperiencia(id) {
  await api.delete(`/catalogo/experiencias/${id}/`)
  cache.invalidatePrefix(PREFIX)
}

export function invalidateExperiencias() {
  cache.invalidatePrefix(PREFIX)
}
