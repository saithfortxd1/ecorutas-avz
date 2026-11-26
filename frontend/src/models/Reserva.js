/** Mapeadores de reservas (endpoint /api/catalogo/reservas/). */

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Respuesta de la API -> modelo de UI. */
export function normalizeReserva(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    experienciaId: raw.experiencia,
    experienciaTitulo: raw.experiencia_titulo ?? '',
    experienciaAnfitrionId: raw.experiencia_anfitrion ?? null,
    clienteId: raw.cliente,
    clienteUsername: raw.cliente_username ?? '',
    clienteNombre: raw.cliente_nombre ?? raw.cliente_username ?? '',
    clienteEmail: raw.cliente_email ?? '',
    clienteTelefono: raw.cliente_telefono ?? '',
    disponibilidadId: raw.disponibilidad ?? null,
    fecha: raw.fecha,
    personas: raw.personas ?? 1,
    precioTotal: toNumber(raw.precio_total),
    estado: raw.estado ?? 'pendiente',
    telefonoContacto: raw.telefono_contacto ?? '',
    notas: raw.notas ?? '',
    createdAt: raw.created_at ?? null,
  }
}

/** Modelo de UI (formulario) -> payload de la API. */
export function reservaToPayload(form) {
  return {
    experiencia: Number(form.experienciaId),
    disponibilidad: form.disponibilidadId ? Number(form.disponibilidadId) : null,
    fecha: form.fecha,
    personas: Number(form.personas) || 1,
    telefono_contacto: String(form.telefonoContacto ?? '').trim(),
    notas: String(form.notas ?? '').trim(),
  }
}