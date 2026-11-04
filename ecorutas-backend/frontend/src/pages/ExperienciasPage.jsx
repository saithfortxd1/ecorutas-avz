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
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function ExperienciasPage() {
  const { user, isAnfitrion, isAdministrador } = useAuth()

  const [experiencias, setExperiencias] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [ordering, setOrdering] = useState('')
  const [category, setCategory] = useState('')

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
  }, [search, ordering, category])

  const canManage = useCallback(
      (experiencia) => isAdministrador || (isAnfitrion && isOwner(experiencia, user)),
    [isAnfitrion, isAdministrador, user],
  )

  const openCreate = useCallback(() => {
    if (!isAnfitrion && !isAdministrador) return
    setEditing(null)
    setModalError('')
    setModalOpen(true)
  }, [isAnfitrion, isAdministrador])

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

  const filteredExperiencias = useMemo(() => (
    category ? experiencias.filter((item) => String(item.categoriaId) === category) : experiencias
  ), [experiencias, category])

  const content = useMemo(() => {
    if (loading) {
      return (
        <div role="status" className="flex flex-col items-center justify-center gap-4 py-20 text-stone-600">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-eco-200 border-t-eco-700 motion-reduce:animate-none" />
          <span className="text-sm">Buscando experiencias para ti…</span>
        </div>
      )
    }
    if (!filteredExperiencias.length) {
      return (
        <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
          <p className="font-display text-2xl text-eco-950">No encontramos rutas con esos filtros</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">Prueba con otra palabra o limpia los filtros para volver a explorar todas las experiencias disponibles.</p>
          <button type="button" onClick={() => { setSearch(''); setCategory('') }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-eco-800 px-5 text-sm font-semibold text-white transition hover:bg-eco-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2"><X size={16} /> Limpiar filtros</button>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filteredExperiencias.map((exp, index) => (
          <ExperienciaCard
            key={exp.id}
            experiencia={exp}
            canManage={canManage(exp)}
            onEdit={openEdit}
            onDelete={handleDelete}
            index={index}
          />
        ))}
      </div>
    )
  }, [loading, filteredExperiencias, canManage, openEdit, handleDelete])

  return (
    <div className="min-h-screen bg-[#f7f5ee]">
      <Navbar onNew={openCreate} />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-7 lg:px-10 lg:pt-12">
        {notice && <p role="status" className="mb-5 rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-sm text-eco-800">{notice}</p>}
        {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => load({ force: true })} className="font-semibold underline underline-offset-2">Intentar de nuevo</button></div>}

        <section className="mb-8 border-b border-stone-200 pb-7 lg:mb-10 lg:pb-9" aria-labelledby="catalog-title">
          <p className="text-xs font-bold uppercase tracking-[.19em] text-eco-700">El territorio te espera</p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 id="catalog-title" className="max-w-3xl font-display text-4xl leading-[1.08] text-eco-950 sm:text-5xl">Encuentra tu próxima <em className="font-normal text-eco-700">gran historia.</em></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">Rutas locales para salir al encuentro de la naturaleza y las culturas que habitan cada paisaje.</p>
            </div>
            <p className="shrink-0 text-sm text-stone-500" aria-live="polite"><strong className="text-eco-950">{loading ? '…' : filteredExperiencias.length}</strong> {filteredExperiencias.length === 1 ? 'experiencia' : 'experiencias'}</p>
          </div>
        </section>

        <section className="mb-7 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-[0_10px_28px_-26px_rgba(24,46,34,.5)] sm:p-4" aria-label="Buscar y filtrar experiencias">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,.42fr)_minmax(11rem,.35fr)]">
            <label className="relative block">
              <span className="sr-only">Buscar experiencias</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="¿Qué te gustaría descubrir?" className="min-h-12 w-full rounded-xl border border-stone-200 bg-[#fbfaf6] py-3 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100" />
            </label>
            <label className="relative block">
              <span className="sr-only">Filtrar por categoría</span>
              <SlidersHorizontal size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" aria-hidden="true" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-stone-200 bg-[#fbfaf6] py-3 pl-10 pr-3 text-sm text-stone-800 focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100">
                <option value="">Todas las categorías</option>
                {categorias.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Ordenar experiencias</span>
              <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="min-h-12 w-full rounded-xl border border-stone-200 bg-[#fbfaf6] px-3 text-sm text-stone-800 focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100">
                <option value="">Orden recomendado</option><option value="precio_unitario">Precio: menor a mayor</option><option value="-precio_unitario">Precio: mayor a menor</option><option value="-created_at">Más recientes</option>
              </select>
            </label>
          </div>
          {(search || category || ordering) && <button type="button" onClick={() => { setSearch(''); setCategory(''); setOrdering('') }} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-eco-800 transition hover:bg-eco-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"><X size={15} />Limpiar filtros</button>}
        </section>

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
