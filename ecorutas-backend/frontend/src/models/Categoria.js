/** Mapeador de categorías (endpoint /api/catalogo/categorias/). */
export function normalizeCategoria(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    nombre: raw.nombre ?? 'Sin nombre',
  }
}
