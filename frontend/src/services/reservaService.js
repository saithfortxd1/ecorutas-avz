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

/** GET /api/catalogo/reservas/ -> reservas visibles para el usuario (propias). */
export async function listarMisReservas() {
  const { data } = await api.get('/catalogo/reservas/')
  return toArray(data).map(normalizeReserva)
}

/** DELETE /api/catalogo/reservas/{id}/ -> cancelar una reserva propia. */
export async function cancelarReserva(id) {
  await api.delete(`/catalogo/reservas/${id}/`)
}
