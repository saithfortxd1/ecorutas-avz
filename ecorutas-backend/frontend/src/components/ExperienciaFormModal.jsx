import { useEffect, useState } from 'react'

const EMPTY = {
  titulo: '',
  descripcion: '',
  categoriaId: '',
  precio: '',
  latitud: '',
  longitud: '',
  estado: 'Activa',
}

/**
 * Modal de creación/edición. Trabaja con el modelo de UI de experiencia
 * (precio, categoriaId, ...) y devuelve un objeto limpio a la página.
 */
export default function ExperienciaFormModal({ open, onClose, onSubmit, initial, categorias, saving, error }) {
  const [form, setForm] = useState(EMPTY)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return
    setLocalError('')
    if (initial) {
      setForm({
        titulo: initial.titulo ?? '',
        descripcion: initial.descripcion ?? '',
        categoriaId: initial.categoriaId ?? '',
        precio: initial.precio ?? '',
        latitud: initial.latitud ?? '',
        longitud: initial.longitud ?? '',
        estado: initial.estado ?? 'Activa',
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, initial])

  if (!open) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (
      !form.titulo.trim() ||
      !form.descripcion.trim() ||
      form.precio === '' ||
      form.latitud === '' ||
      form.longitud === ''
    ) {
      setLocalError('Completa todos los campos obligatorios.')
      return
    }
    setLocalError('')
    onSubmit({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      precio: String(form.precio),
      latitud: String(form.latitud),
      longitud: String(form.longitud),
      estado: form.estado,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
    })
  }

  const displayedError = localError || error
  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-eco-500 focus:outline-none focus:ring-2 focus:ring-eco-200'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-800">
          {initial ? 'Editar Experiencia' : 'Crear Experiencia'}
        </h2>

        {displayedError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {displayedError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="titulo">Título</label>
            <input id="titulo" name="titulo" value={form.titulo} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion" name="descripcion" rows="3" value={form.descripcion}
              onChange={handleChange} className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="categoriaId">Categoría</label>
              <select id="categoriaId" name="categoriaId" value={form.categoriaId} onChange={handleChange} className={inputClass}>
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="precio">Precio unitario</label>
              <input
                id="precio" name="precio" type="number" step="0.01" min="0"
                value={form.precio} onChange={handleChange} className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="latitud">Latitud</label>
              <input
                id="latitud" name="latitud" type="number" step="0.000001" min="-90" max="90"
                value={form.latitud} onChange={handleChange} className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="longitud">Longitud</label>
              <input
                id="longitud" name="longitud" type="number" step="0.000001" min="-180" max="180"
                value={form.longitud} onChange={handleChange} className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="estado">Estado</label>
            <select id="estado" name="estado" value={form.estado} onChange={handleChange} className={inputClass}>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
              <option value="Borrador">Borrador</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="rounded-lg bg-eco-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-eco-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
