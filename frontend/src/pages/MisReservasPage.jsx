import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, CircleSlash, Mail, Phone, Users, UserRound, ClipboardList } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listarReservas, actualizarEstado } from '../services/reservaService.js'
import { formatCurrencyCOP } from '../utils/formatters.js'
import { extractErrorMessage } from '../utils/errors.js'

const ESTADO_ESTILO = {
  pendiente: 'bg-amber-100 text-amber-800',
  confirmada: 'bg-eco-100 text-eco-800',
  completada: 'bg-blue-100 text-blue-800',
  cancelada: 'bg-stone-100 text-stone-600',
}

function EstadoBadge({ estado }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ESTADO_ESTILO[estado] || 'bg-stone-100 text-stone-600'}`}>{estado}</span>
}

function ReservaRecibidaCard({ reserva, onEstado, busy }) {
  return (
    <li className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-[0_12px_34px_-30px_rgba(24,46,34,.4)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-eco-700">Plan reservado</p>
          <Link to={`/experiencias/${reserva.experienciaId}`} className="font-bold text-eco-900 hover:underline">{reserva.experienciaTitulo}</Link>
        </div>
        <EstadoBadge estado={reserva.estado} />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5"><UserRound size={13} aria-hidden="true" /><strong className="text-stone-800">{reserva.clienteNombre}</strong> (@{reserva.clienteUsername})</span>
        <span className="inline-flex items-center gap-1.5"><Mail size={13} aria-hidden="true" />{reserva.clienteEmail || 'Sin correo'}</span>
        <span className="inline-flex items-center gap-1.5"><Phone size={13} aria-hidden="true" />{reserva.telefonoContacto || reserva.clienteTelefono || 'Sin telefono'}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} aria-hidden="true" />{reserva.fecha}</span>
        <span className="inline-flex items-center gap-1.5"><Users size={13} aria-hidden="true" />{reserva.personas} persona(s)</span>
        <span className="font-semibold text-eco-900">{formatCurrencyCOP(reserva.precioTotal)}</span>
      </div>

      {reserva.notas && <p className="mt-3 rounded-lg bg-[#fbfaf6] px-3 py-2 text-xs text-stone-600"><ClipboardList size={13} className="mr-1 inline" aria-hidden="true" />{reserva.notas}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {reserva.estado === 'pendiente' && (
          <button type="button" disabled={busy} onClick={() => onEstado(reserva, 'confirmada')} className="inline-flex items-center gap-1.5 rounded-lg bg-eco-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-eco-800 disabled:opacity-50">
            <CheckCircle2 size={14} />Confirmar
          </button>
        )}
        {reserva.estado === 'confirmada' && (
          <button type="button" disabled={busy} onClick={() => onEstado(reserva, 'completada')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
            <CheckCircle2 size={14} />Marcar completada
          </button>
        )}
        {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
          <button type="button" disabled={busy} onClick={() => onEstado(reserva, 'cancelada')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
            <CircleSlash size={14} />Cancelar
          </button>
        )}
      </div>
    </li>
  )
}

function MiReservaCard({ reserva, onEstado, busy }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-[0_12px_34px_-30px_rgba(24,46,34,.4)]">
      <div className="min-w-0">
        <Link to={`/experiencias/${reserva.experienciaId}`} className="font-bold text-eco-900 hover:underline">{reserva.experienciaTitulo}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" />{reserva.fecha}</span>
          <span className="inline-flex items-center gap-1"><Users size={13} aria-hidden="true" />{reserva.personas} persona(s)</span>
          <EstadoBadge estado={reserva.estado} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <strong className="text-eco-900">{formatCurrencyCOP(reserva.precioTotal)}</strong>
        {reserva.estado !== 'cancelada' && reserva.estado !== 'completada' && (
          <button type="button" disabled={busy} onClick={() => onEstado(reserva, 'cancelada')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
            <CircleSlash size={14} />Cancelar
          </button>
        )}
      </div>
    </li>
  )
}

export default function MisReservasPage() {
  const { user, isAnfitrion, isAdministrador } = useAuth()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const esGestor = isAdministrador || isAnfitrion

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) {
      setLoading(true)
      setError('')
    }
    try {
      setReservas(await listarReservas())
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudieron cargar las reservas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    const actualizar = () => { void cargar({ silencioso: true }) }
    const intervalo = window.setInterval(actualizar, 10000)
    window.addEventListener('focus', actualizar)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener('focus', actualizar)
    }
  }, [cargar])

  const recibidas = useMemo(() => {
    if (!user) return []
    if (isAdministrador) return reservas.filter((r) => r.clienteId !== user.id)
    if (isAnfitrion) return reservas.filter((r) => r.experienciaAnfitrionId === user.id && r.clienteId !== user.id)
    return []
  }, [reservas, user, isAnfitrion, isAdministrador])

  const propias = useMemo(() => reservas.filter((r) => r.clienteId === user?.id), [reservas, user])

  const cambiarEstado = async (reserva, estado) => {
    setBusyId(reserva.id)
    setError('')
    try {
      const actualizada = await actualizarEstado(reserva.id, estado)
      setReservas((items) => items.map((item) => item.id === actualizada.id ? actualizada : item))
    } catch (err) {
      setError(extractErrorMessage(err, 'No se pudo actualizar la reserva.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ee]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-7">
        <header className="border-b border-stone-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[.19em] text-eco-700">Gestion de reservas</p>
          <h1 className="mt-2 font-display text-3xl text-eco-950 sm:text-4xl">Reservas</h1>
          <p className="mt-2 text-sm text-stone-600">Consulta tus reservas y, si eres anfitrion o administrador, gestiona las solicitudes de tus clientes.</p>
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="py-16 text-center text-stone-500">Cargando reservas...</p>
        ) : (
          <>
            {esGestor && (
              <section className="mt-8">
                <h2 className="flex items-center gap-2 font-display text-xl text-eco-950"><ClipboardList size={18} aria-hidden="true" />Reservas recibidas de clientes</h2>
                {recibidas.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white/60 px-4 py-8 text-center text-sm text-stone-500">
                    Aún no tienes reservas entrantes. Cuando un cliente reserve uno de tus planes aparecerá aquí.
                    {isAnfitrion && <> Publica una experiencia desde el <Link to="/experiencias" className="font-semibold text-eco-800 underline">catálogo</Link> para empezar a recibir solicitudes.</>}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {recibidas.map((r) => (
                      <ReservaRecibidaCard key={r.id} reserva={r} onEstado={cambiarEstado} busy={busyId === r.id} />
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-xl text-eco-950">Mis reservas</h2>
              {propias.length === 0 ? (
                <div className="mt-3 rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
                  <p className="font-display text-xl text-eco-950">Aun no tienes reservas</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">Explora el catalogo y solicita tu primera experiencia.</p>
                  <Link to="/experiencias" className="mt-5 inline-block rounded-full bg-eco-800 px-6 py-3 text-sm font-semibold text-white hover:bg-eco-900">Explorar experiencias</Link>
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {propias.map((r) => (
                    <MiReservaCard key={r.id} reserva={r} onEstado={cambiarEstado} busy={busyId === r.id} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}