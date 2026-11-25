import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Leaf, MapPin, Trash2, UserRound, Users } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import FullScreenLoader from '../components/FullScreenLoader.jsx'
import { getExperiencia, listDisponibilidades } from '../services/experienciaService.js'
import { crearReserva, listarMisReservas, cancelarReserva } from '../services/reservaService.js'
import { formatCurrencyCOP } from '../utils/formatters.js'
import { getExperienceImageInfo } from '../utils/experienceImages.js'
import { extractErrorMessage } from '../utils/errors.js'

const HOY = new Date().toISOString().slice(0, 10)

export default function ExperienciaDetallePage() {
  const { id } = useParams()

  const [experiencia, setExperiencia] = useState(null)
  const [disponibilidades, setDisponibilidades] = useState([])
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [fecha, setFecha] = useState(HOY)
  const [personas, setPersonas] = useState(1)
  const [disponibilidadId, setDisponibilidadId] = useState('')
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(null)

  const cargarReservas = useCallback(async () => {
    try {
      setReservas(await listarMisReservas())
    } catch {
      setReservas([])
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([getExperiencia(id), listDisponibilidades(id)])
      .then(([exp, disp]) => {
        if (!active) return
        setExperiencia(exp)
        setDisponibilidades(disp)
      })
      .catch((err) => {
        if (active) setError(extractErrorMessage(err, 'No se pudo cargar el plan.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    cargarReservas()
    return () => {
      active = false
    }
  }, [id, cargarReservas])

  const misReservasDelPlan = useMemo(
    () => reservas.filter((r) => String(r.experienciaId) === String(id)),
    [reservas, id],
  )

  const precioTotal = useMemo(
    () => (experiencia ? experiencia.precio * (Number(personas) || 1) : 0),
    [experiencia, personas],
  )

  const handleDisponibilidad = (value) => {
    setDisponibilidadId(value)
    const slot = disponibilidades.find((d) => String(d.id) === String(value))
    if (slot) setFecha(slot.fecha)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSuccess(null)

    if (!fecha) {
      setFormError('Selecciona una fecha para tu reserva.')
      return
    }
    if (Number(personas) < 1) {
      setFormError('Indica al menos 1 persona.')
      return
    }

    setSubmitting(true)
    try {
      const reserva = await crearReserva({
        experienciaId: id,
        disponibilidadId: disponibilidadId || null,
        fecha,
        personas: Number(personas),
        notas,
      })
      setSuccess(reserva)
      setNotas('')
      setDisponibilidadId('')
      setPersonas(1)
      await cargarReservas()
    } catch (err) {
      setFormError(extractErrorMessage(err, 'No se pudo registrar la reserva.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelar = async (reserva) => {
    if (!window.confirm(`¿Cancelar la reserva del ${reserva.fecha}?`)) return
    try {
      await cancelarReserva(reserva.id)
      await cargarReservas()
    } catch (err) {
      setFormError(extractErrorMessage(err, 'No se pudo cancelar la reserva.'))
    }
  }

  if (loading) return <div className="min-h-screen bg-[#f7f5ee]"><Navbar /><FullScreenLoader /></div>

  if (error || !experiencia) {
    return (
      <div className="min-h-screen bg-[#f7f5ee]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-7">
          <h1 className="font-display text-3xl text-eco-950">Plan no disponible</h1>
          <p className="mt-3 text-sm text-stone-600">{error || 'No encontramos este plan.'}</p>
          <Link to="/experiencias" className="mt-6 inline-block rounded-full bg-eco-800 px-6 py-3 text-sm font-semibold text-white hover:bg-eco-900">
            Volver al catálogo
          </Link>
        </main>
      </div>
    )
  }

  const imagen = getExperienceImageInfo(experiencia)
  const inputClass = 'mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100'

  return (
    <div className="min-h-screen bg-[#f7f5ee]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-7">
        <Link to="/experiencias" className="text-sm font-semibold text-eco-800 hover:underline">← Volver al catálogo</Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Detalle del plan */}
          <article className="overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-white shadow-[0_18px_50px_-34px_rgba(24,46,34,.4)]">
            {imagen.url && (
              <img src={imagen.url} alt="" className="aspect-[16/9] w-full object-cover" loading="eager" decoding="async" />
            )}
            <div className="p-6 sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-eco-200 bg-eco-50 px-3 py-1 text-xs font-semibold text-eco-800">
                <Leaf size={13} aria-hidden="true" />{experiencia.categoriaNombre}
              </span>
              <h1 className="mt-4 font-display text-3xl text-eco-950 sm:text-4xl">{experiencia.titulo}</h1>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{experiencia.descripcion}</p>

              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-600">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-eco-700" aria-hidden="true" />{experiencia.latitud.toFixed(4)}, {experiencia.longitud.toFixed(4)}</div>
                {experiencia.anfitrionUsername && <div className="flex items-center gap-2"><UserRound size={16} className="text-eco-700" aria-hidden="true" />Anfitrión @{experiencia.anfitrionUsername}</div>}
                <div className="flex items-center gap-2"><Users size={16} className="text-eco-700" aria-hidden="true" />{experiencia.estado}</div>
              </dl>

              <p className="mt-6 text-3xl font-bold text-eco-900">{formatCurrencyCOP(experiencia.precio)} <span className="text-sm font-medium text-stone-500">/ persona</span></p>

              {disponibilidades.length > 0 && (
                <section className="mt-8">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500"><CalendarDays size={16} aria-hidden="true" />Disponibilidad</h2>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {disponibilidades.map((d) => (
                      <li key={d.id} className="rounded-xl border border-stone-200 bg-[#fbfaf6] px-4 py-3 text-sm text-stone-700">
                        <strong className="text-eco-900">{d.fecha}</strong> · {d.horaInicio}–{d.horaFin} · {d.cuposTotales} cupos
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {experiencia.fotos.length > 1 && (
                <section className="mt-8">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Galería</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {experiencia.fotos.map((foto) => (
                      <img key={foto.id} src={foto.url_foto} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" decoding="async" />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>

          {/* Reserva */}
          <aside className="h-fit rounded-[1.5rem] border border-stone-200/80 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(24,46,34,.4)]">
            <h2 className="font-display text-xl text-eco-950">Reservar este plan</h2>

            {success && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm text-eco-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>Reserva registrada (estado: {success.estado}). Total {formatCurrencyCOP(success.precioTotal)} para {success.personas} persona(s).</span>
              </div>
            )}
            {formError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {disponibilidades.length > 0 && (
                <label className="block text-xs font-bold text-stone-600">
                  Fecha disponible (opcional)
                  <select value={disponibilidadId} onChange={(e) => handleDisponibilidad(e.target.value)} className={inputClass}>
                    <option value="">Elegir fecha manualmente</option>
                    {disponibilidades.map((d) => (
                      <option key={d.id} value={d.id}>{d.fecha} ({d.cuposTotales} cupos)</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-xs font-bold text-stone-600">
                Fecha de la reserva
                <input type="date" min={HOY} value={fecha} onChange={(e) => setFecha(e.target.value)} required className={inputClass} />
              </label>

              <label className="block text-xs font-bold text-stone-600">
                Personas
                <input type="number" min="1" step="1" value={personas} onChange={(e) => setPersonas(e.target.value)} required className={inputClass} />
              </label>

              <label className="block text-xs font-bold text-stone-600">
                Notas (opcional)
                <textarea rows="3" value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClass} placeholder="Preferencias, llegada, etc." />
              </label>

              <div className="flex items-center justify-between rounded-xl bg-[#fbfaf6] px-4 py-3 text-sm">
                <span className="text-stone-500">Total estimado</span>
                <strong className="text-lg text-eco-900">{formatCurrencyCOP(precioTotal)}</strong>
              </div>

              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-eco-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-eco-900 disabled:opacity-60">
                {submitting ? 'Enviando solicitud...' : 'Solicitar reserva'}
              </button>
              <p className="text-center text-xs text-stone-500">La solicitud queda en estado pendiente hasta su confirmación.</p>
            </form>

            {misReservasDelPlan.length > 0 && (
              <section className="mt-6 border-t border-stone-200 pt-5">
                <h3 className="text-sm font-bold text-stone-600">Mis reservas de este plan</h3>
                <ul className="mt-3 space-y-2">
                  {misReservasDelPlan.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#fbfaf6] px-4 py-3 text-sm">
                      <span className="text-stone-700">{r.fecha} · {r.personas} pers. · <em className="not-italic font-semibold text-eco-800">{r.estado}</em></span>
                      <button type="button" onClick={() => handleCancelar(r)} aria-label="Cancelar reserva" className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                        <Trash2 size={13} />Cancelar
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
