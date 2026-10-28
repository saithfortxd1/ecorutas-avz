import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import ExperienciaCard from '../components/ExperienciaCard.jsx'
import ExperienciaFormModal from '../components/ExperienciaFormModal.jsx'
import { listCategorias } from '../services/categoriaService.js'
import {
  listExperiencias,
  createExperiencia,
  updateExperiencia,
  deleteExperiencia,
} from '../services/experienciaService.js'
import { isOwner } from '../models/Experiencia.js'
import { extractErrorMessage } from '../utils/errors.js'

export default function ExperienciasPage() {
  const { user, isAnfitrion } = useAuth()

  const [experiencias, setExperiencias] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [ordering, setOrdering] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const requestIdRef = useRef(0)

  // Catálogo de categorías (servicio con caché en memoria).
  useEffect(() => {
    let active = true
    listCategorias()
      .then((data) => {
        if (active) setCategorias(data)
      })
      .catch(() => {
        if (active) setCategorias([])
      })
    return () => {
      active = false
    }
  }, [])

  const load = useCallback(
    async ({ force = false } = {}) => {
      const requestId = ++requestIdRef.current
      setLoading(true)
      setError('')
      try {
        const data = await listExperiencias({ search, ordering }, { force })
        if (requestId !== requestIdRef.current) return
        setExperiencias(data)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(extractErrorMessage(err, 'No se pudieron cargar las experiencias.'))
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    [search, ordering],
  )

  // Búsqueda/orden con debounce; las consultas repetidas salen de la caché.
  useEffect(() => {
    const timer = setTimeout(() => load(), 300)
    return () => clearTimeout(timer)
  }, [load])

  // Limpia el aviso de éxito al cambiar de filtros.
  useEffect(() => {
    setNotice('')
  }, [search, ordering])

  const canManage = useCallback(
    (experiencia) => isAnfitrion && isOwner(experiencia, user),
    [isAnfitrion, user],
  )

  const openCreate = useCallback(() => {
    if (!isAnfitrion) return
    setEditing(null)
    setModalError('')
    setModalOpen(true)
  }, [isAnfitrion])

  const openEdit = useCallback(
    (experiencia) => {
      if (!canManage(experiencia)) return
      setEditing(experiencia)
      setModalError('')
      setModalOpen(true)
    },
    [canManage],
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditing(null)
  }, [])

  const handleSubmit = useCallback(
    async (form) => {
      setSaving(true)
      setModalError('')
      try {
        if (editing) {
          await updateExperiencia(editing.id, form)
          setNotice('Experiencia actualizada correctamente.')
        } else {
          await createExperiencia(form)
          setNotice('Experiencia creada correctamente.')
        }
        closeModal()
        await load()
      } catch (err) {
        setModalError(extractErrorMessage(err))
      } finally {
        setSaving(false)
      }
    },
    [editing, closeModal, load],
  )

  const handleDelete = useCallback(
    async (experiencia) => {
      if (!canManage(experiencia)) return
      if (!window.confirm(`¿Eliminar la experiencia "${experiencia.titulo}"?`)) return
      setError('')
      try {
        await deleteExperiencia(experiencia.id)
        setNotice('Experiencia eliminada correctamente.')
        await load()
      } catch (err) {
        setError(extractErrorMessage(err))
      }
    },
    [canManage, load],
  )

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-200 border-t-eco-600" />
        </div>
      )
    }
    if (!experiencias.length) {
      return <p className="py-16 text-center text-slate-500">No hay experiencias para mostrar.</p>
    }
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {experiencias.map((exp) => (
          <ExperienciaCard
            key={exp.id}
            experiencia={exp}
            canManage={canManage(exp)}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    )
  }, [loading, experiencias, canManage, openEdit, handleDelete])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onNew={openCreate} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {notice && (
          <p className="mb-4 rounded-lg border border-eco-200 bg-eco-50 px-3 py-2 text-sm text-eco-700">{notice}</p>
        )}
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción o categoría..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-eco-500 focus:outline-none focus:ring-2 focus:ring-eco-200"
          />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-eco-500 focus:outline-none focus:ring-2 focus:ring-eco-200 sm:w-56"
          >
            <option value="">Orden por defecto</option>
            <option value="precio_unitario">Precio (asc)</option>
            <option value="-precio_unitario">Precio (desc)</option>
            <option value="-created_at">Más recientes</option>
          </select>
        </div>

        {content}
      </main>

      <ExperienciaFormModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={editing}
        categorias={categorias}
        saving={saving}
        error={modalError}
      />
    </div>
  )
}
