/** Mapeadores de experiencias (endpoint /api/catalogo/experiencias/). */

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Respuesta de la API -> modelo de UI. */
export function normalizeExperiencia(raw) {
  if (!raw) return null
  const precio = toNumber(raw.precio_unitario)

  return {
    id: raw.id,
    titulo: raw.titulo ?? '',
    descripcion: raw.descripcion ?? '',
    precio,
    precioTexto: precio.toFixed(2),
    latitud: toNumber(raw.latitud),
    longitud: toNumber(raw.longitud),
    estado: raw.estado ?? 'Activa',
    categoriaId: raw.categoria ?? null,
    categoriaNombre: raw.categoria_nombre ?? 'Sin categoría',
    anfitrionId: raw.anfitrion ?? null,
    anfitrionUsername: raw.anfitrion_username ?? null,
    createdAt: raw.created_at ?? null,
    traducciones: Array.isArray(raw.traducciones) ? raw.traducciones : [],
    fotos: Array.isArray(raw.fotos) ? raw.fotos : [],
  }
}

/** Modelo de UI (formulario) -> payload de la API. */
export function experienciaToPayload(form) {
  return {
    titulo: String(form.titulo ?? '').trim(),
    descripcion: String(form.descripcion ?? '').trim(),
    precio_unitario: String(form.precio ?? ''),
    latitud: String(form.latitud ?? ''),
    longitud: String(form.longitud ?? ''),
    estado: form.estado || 'Activa',
    categoria: form.categoriaId != null && form.categoriaId !== '' ? Number(form.categoriaId) : null,
  }
}

/** true si el usuario es el anfitrión propietario de la experiencia. */
export function isOwner(experiencia, usuario) {
  return !!usuario && experiencia?.anfitrionId != null && experiencia.anfitrionId === usuario.id
}
