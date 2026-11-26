import api from '../api/axiosClient.js'
import { normalizeReserva, reservaToPayload } from '../models/Reserva.js'

function toArray(data) {
  return Array.isArray(data) ? data : data?.results ?? []
}

/** POST /api/catalogo/reservas/ -> crea la solicitud de reserva del cliente actual. */
export async function crearReserva(form) {
  const { data } = await api.post('/catalogo/reservas/', reservaToPayload(form))
  return normalizeReserva(data)
}

/** GET /api/catalogo/reservas/ -> reservas visibles para el usuario
 *  (propias del cliente + recibidas si es anfitrion; todas si es administrador). */
export async function listarReservas() {
  const { data } = await api.get('/catalogo/reservas/')
  return toArray(data).map(normalizeReserva)
}

/** Alias retrocompatible. */
export const listarMisReservas = listarReservas

/** PATCH /api/catalogo/reservas/{id}/ -> cambia el estado (anfitrion/admin)
 *  o cancela (cliente dueno). */
export async function actualizarEstado(id, estado, extra = {}) {
  const { data } = await api.patch(`/catalogo/reservas/${id}/`, { estado, ...extra })
  return normalizeReserva(data)
}

/** PATCH /api/catalogo/reservas/{id}/ -> cancela una reserva propia y conserva el historial. */
export async function cancelarReserva(id) {
  const { data } = await api.patch(`/catalogo/reservas/${id}/`, { estado: 'cancelada' })
  return normalizeReserva(data)
}