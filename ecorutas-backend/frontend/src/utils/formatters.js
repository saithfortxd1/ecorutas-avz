const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCurrencyCOP(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? copFormatter.format(amount) : '—'
}
