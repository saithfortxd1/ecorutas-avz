/** Traduce errores de DRF/axios a un mensaje legible para la UI. */
export function extractErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const parts = []
  Object.entries(data).forEach(([key, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    parts.push(key === 'non_field_errors' ? text : `${key}: ${text}`)
  })
  return parts.length ? parts.join(' | ') : fallback
}
