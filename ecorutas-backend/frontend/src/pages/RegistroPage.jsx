import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../utils/errors.js'

const INITIAL = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  rol: 'turista',
  documento_identidad: '',
  password: '',
  password_confirm: '',
}

export default function RegistroPage() {
  const { register, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/experiencias" replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRolChange = (event) => {
    const rol = event.target.value
    setForm((prev) => ({ ...prev, rol, documento_identidad: rol === 'anfitrion' ? prev.documento_identidad : '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (form.password !== form.password_confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.rol === 'anfitrion' && !form.documento_identidad.trim()) {
      setError('El documento de identidad es obligatorio para anfitriones.')
      return
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      rol: form.rol,
      password: form.password,
      password_confirm: form.password_confirm,
    }
    if (form.rol === 'anfitrion') payload.documento_identidad = form.documento_identidad.trim()

    setSubmitting(true)
    try {
      await register(payload)
      // Auto-login tras el registro y luego ir al catálogo.
      await login(payload.username, payload.password)
      navigate('/experiencias', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'min-h-11 w-full rounded-xl border border-stone-300 bg-[#fbfaf6] px-3 py-2.5 text-sm focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100'

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f7f5ee] p-4 pt-20 sm:p-8 sm:pt-20">
      <Link to="/" className="absolute left-4 top-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-eco-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 sm:left-8 sm:top-8"><ArrowLeft size={17} aria-hidden="true" />Volver al inicio</Link>
      <div className="w-full max-w-lg rounded-[1.75rem] border border-white bg-white/90 p-6 shadow-[0_26px_70px_-42px_rgba(20,60,43,.45)] backdrop-blur-sm sm:p-9">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-eco-800 text-white"><Leaf size={21} aria-hidden="true" /></span>
        <h1 className="mt-4 font-display text-3xl text-eco-950">Empieza tu próxima ruta</h1>
        <p className="mt-2 text-sm text-stone-600">Crea tu cuenta como turista o anfitrión local.</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="first_name">Nombre</label>
              <input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="last_name">Apellido</label>
              <input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="username">Usuario</label>
            <input id="username" name="username" autoComplete="username" value={form.username} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="rol">Rol</label>
            <select id="rol" name="rol" value={form.rol} onChange={handleRolChange} className={inputClass}>
              <option value="turista">Turista</option>
              <option value="anfitrion">Anfitrión</option>
            </select>
          </div>

          {form.rol === 'anfitrion' && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="documento_identidad">
                Documento de identidad
              </label>
              <input
                id="documento_identidad" name="documento_identidad" value={form.documento_identidad}
                onChange={handleChange} className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">Obligatorio para el rol Anfitrión.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password"
                value={form.password} onChange={handleChange} className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password_confirm">Confirmar contraseña</label>
              <input
                id="password_confirm" name="password_confirm" type="password" autoComplete="new-password"
                value={form.password_confirm} onChange={handleChange} className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full rounded-lg bg-eco-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-eco-700 disabled:opacity-50"
          >
            {submitting ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-eco-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
