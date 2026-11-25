import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Trash2, Users } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { listarMisReservas, cancelarReserva } from '../services/reservaService.js'
import { formatCurrencyCOP } from '../utils/formatters.js'
import { extractErrorMessage } from '../utils/errors.js'

const ESTADO_ESTILO = {
  pendiente: 'bg-amber-100 text-amber-800',
  confirmada: 'bg-eco-100 text-eco-800',
  cancelada: 'bg-stone-100 text-stone-600',
}

export default function MisReservasPage() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReservas(await listarMisReservas())
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar tus reservas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const handleCancelar = async (reserva) => {
    if (!window.confirm(`¿Cancelar tu reserva de "${reserva.experienciaTitulo}"?`)) return
    try {
      await cancelarReserva(reserva.id)
      await cargar()
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo cancelar la reserva.'))
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ee]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-7">
        <header className="border-b border-stone-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[.19em] text-eco-700">Tu actividad</p>
          <h1 className="mt-2 font-display text-3xl text-eco-950 sm:text-4xl">Mis reservas</h1>
          <p className="mt-2 text-sm text-stone-600">Consulta el estado de tus solicitudes y cancela las que ya no necesites.</p>
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="py-16 text-center text-stone-500">Cargando tus reservas...</p>
        ) : reservas.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
            <p className="font-display text-2xl text-eco-950">Aún no tienes reservas</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">Explora el catálogo y solicita tu primera experiencia.</p>
            <Link to="/experiencias" className="mt-5 inline-block rounded-full bg-eco-800 px-6 py-3 text-sm font-semibold text-white hover:bg-eco-900">Explorar experiencias</Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {reservas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-[0_12px_34px_-30px_rgba(24,46,34,.4)]">
                <div className="min-w-0">
                  <Link to={`/experiencias/${r.experienciaId}`} className="font-bold text-eco-900 hover:underline">{r.experienciaTitulo}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" />{r.fecha}</span>
                    <span className="inline-flex items-center gap-1"><Users size={13} aria-hidden="true" />{r.personas} persona(s)</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${ESTADO_ESTILO[r.estado] || 'bg-stone-100 text-stone-600'}`}>{r.estado}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <strong className="text-eco-900">{formatCurrencyCOP(r.precioTotal)}</strong>
                  <button
                    type="button"
                    onClick={() => handleCancelar(r)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
