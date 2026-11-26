/** Mapeador de disponibilidades (endpoint /api/catalogo/disponibilidades/). */
export function normalizeDisponibilidad(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    experienciaId: raw.experiencia,
    experienciaTitulo: raw.experiencia_titulo ?? '',
    fecha: raw.fecha,
    horaInicio: raw.hora_inicio,
    horaFin: raw.hora_fin,
    cuposTotales: raw.cupos_totales ?? 0,
    cuposDisponibles: raw.cupos_disponibles ?? raw.cupos_totales ?? 0,
  }
}
