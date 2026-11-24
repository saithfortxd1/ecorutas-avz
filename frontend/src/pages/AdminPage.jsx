import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Layers3, Lock, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../components/Navbar.jsx'
import AdminForm from '../components/admin/AdminForm.jsx'
import AdminList from '../components/admin/AdminList.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { recursosAdmin, rolesAdmin, usuariosAdmin } from '../services/rbacService.js'
import { findResourceByApiPath, findResourceByPath, resourceCanWrite } from '../utils/rbac.js'

// Gating por RUTA/ENDPOINT (nunca por nombre con tildes).
const SECTIONS = [
  { key: 'usuarios', title: 'Usuarios', path: '/admin/usuarios', apiPath: '/api/usuarios/admin/', icon: Users, service: usuariosAdmin, aux: 'roles' },
  { key: 'roles', title: 'Roles', path: '/admin/roles', apiPath: '/api/usuarios/roles/', icon: ShieldCheck, service: rolesAdmin, aux: 'recursos' },
  { key: 'recursos', title: 'Recursos', path: '/admin/recursos', apiPath: '/api/usuarios/recursos/', icon: Layers3, service: recursosAdmin, aux: null },
]

const EMPTY = {
  usuarios: { username: '', email: '', first_name: '', last_name: '', password: '', roles: [], is_active: true },
  roles: { nombre: '', recursos: [] },
  recursos: { nombre: '', path: '', icono: 'grid', permisos: [] },
}

function toArray(data) {
  return Array.isArray(data) ? data : data?.results ?? []
}

function NoAccessPanel() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-amber-100 bg-white/80 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Lock size={22} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-slate-900">Sin acceso al Control de acceso</h2>
      <p className="mt-2 text-sm text-slate-600">
        Tu cuenta no tiene asignado ningun recurso de administracion (Usuarios, Roles o Recursos).
      </p>
      <Link to="/experiencias" className="mt-6 inline-block rounded-lg bg-eco-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-eco-700">
        Ir a experiencias
      </Link>
    </div>
  )
}

export default function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { recursos } = useAuth()

  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [resources, setResources] = useState([])
  const [draft, setDraft] = useState(EMPTY.recursos)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  const permittedSections = useMemo(
    () =>
      SECTIONS.filter(
        (section) =>
          Boolean(findResourceByPath(recursos, section.path)) ||
          Boolean(findResourceByApiPath(recursos, section.apiPath)),
      ),
    [recursos],
  )

  const activeSection = useMemo(() => {
    const byPath = SECTIONS.find((section) => section.path === location.pathname)
    if (byPath && permittedSections.some((section) => section.key === byPath.key)) return byPath
    return permittedSections[0] ?? null
  }, [location.pathname, permittedSections])

  const section = activeSection?.key ?? null
  const title = activeSection?.title ?? 'Administracion'

  const activeResource = useMemo(() => {
    if (!activeSection) return null
    return (
      findResourceByPath(recursos, activeSection.path) ??
      findResourceByApiPath(recursos, activeSection.apiPath)
    )
  }, [recursos, activeSection])

  const canWrite = Boolean(activeResource) && resourceCanWrite(activeResource)

  const loadRows = useCallback(async () => {
    if (!activeSection) return
    setLoading(true)
    setForbidden(false)
    try {
      setRows(toArray(await activeSection.service.list()))
    } catch (error) {
      if (error?.response?.status === 403) setForbidden(true)
      else toast.error('No se pudieron cargar los datos.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [activeSection])

  const loadAux = useCallback(async () => {
    if (!activeSection?.aux) return
    try {
      if (activeSection.aux === 'roles') setRoles(toArray(await rolesAdmin.list()))
      if (activeSection.aux === 'recursos') setResources(toArray(await recursosAdmin.list()))
    } catch {
      // Datos auxiliares sin permisos: se listan vacios sin romper la vista.
      if (activeSection.aux === 'roles') setRoles([])
      if (activeSection.aux === 'recursos') setResources([])
    }
  }, [activeSection])

  useEffect(() => {
    if (!activeSection) {
      setLoading(false)
      return
    }
    setDraft(EMPTY[activeSection.key])
    setEditingId(null)
    loadRows()
    loadAux()
  }, [activeSection, loadRows, loadAux])

  const reset = () => {
    setDraft(EMPTY[section] ?? EMPTY.recursos)
    setEditingId(null)
  }

  const beginEdit = (item) => {
    setEditingId(item.id)
    if (section === 'usuarios') setDraft({ ...item, password: '', roles: item.roles || [] })
    else if (section === 'roles') setDraft({ nombre: item.nombre, recursos: item.recursos || [] })
    else setDraft({ ...item, permisos: item.permisos || [] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleId = (key, id) =>
    setDraft((current) => {
      const values = (current[key] || []).map(Number)
      return {
        ...current,
        [key]: values.includes(Number(id))
          ? values.filter((value) => value !== Number(id))
          : [...values, Number(id)],
      }
    })

  const save = async (event) => {
    event.preventDefault()
    if (!canWrite || !activeSection) return
    setSaving(true)
    try {
      if (section === 'usuarios') {
        const payload = { ...draft, roles: (draft.roles || []).map(Number) }
        if (editingId && !payload.password) delete payload.password
        if (editingId) await activeSection.service.update(editingId, payload)
        else await activeSection.service.create(payload)
      } else if (section === 'roles') {
        const payload = { ...draft, recursos: (draft.recursos || []).map(Number) }
        if (editingId) await activeSection.service.update(editingId, payload)
        else await activeSection.service.create(payload)
      } else {
        const permisos = typeof draft.permisos === 'string' ? JSON.parse(draft.permisos) : draft.permisos
        const payload = { ...draft, permisos }
        if (editingId) await activeSection.service.update(editingId, payload)
        else await activeSection.service.create(payload)
      }
      toast.success(editingId ? `${title} actualizado correctamente` : `${title} creado correctamente`)
      reset()
      await loadRows()
    } catch (error) {
      if (error?.response?.status === 403) toast.error('No tienes permisos para guardar en esta seccion.')
      else if (error instanceof SyntaxError) toast.error('El JSON de permisos no tiene un formato valido.')
      else toast.error('No se pudo guardar. Revisa los campos e intentalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!canWrite || !activeSection) return
    if (section === 'usuarios' && item.username === 'admin') {
      toast.error('No se puede eliminar la cuenta administradora activa.')
      return
    }
    if (section === 'roles' && item.nombre === 'Administrador') {
      toast.error('El rol base Administrador esta protegido.')
      return
    }
    if (!window.confirm(`Eliminar ${item.nombre || item.username}?`)) return
    try {
      await activeSection.service.remove(item.id)
      toast.success(`${title} eliminado correctamente`)
      if (editingId === item.id) reset()
      await loadRows()
    } catch (error) {
      if (error?.response?.status === 403) toast.error('No tienes permisos para eliminar en esta seccion.')
      else toast.error('No se pudo eliminar este registro.')
    }
  }

  if (!activeSection) {
    return (
      <div className="min-h-screen bg-[#f5f7f2]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-9 sm:px-7">
          <NoAccessPanel />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Control de acceso</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Gestion de {title.toLowerCase()}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Administra las cuentas y los permisos que construyen la experiencia EcoRutas.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm">
            <KeyRound size={15} /> {canWrite ? 'RBAC activo' : 'Solo lectura'}
          </span>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white bg-white/65 p-2 shadow-sm backdrop-blur-md" aria-label="Modulos administrativos">
          {permittedSections.map(({ key, path, title: tabTitle, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${section === key ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}
            >
              <Icon size={17} />
              {tabTitle}
            </button>
          ))}
        </nav>

        <div className={`mt-6 grid gap-6 ${canWrite ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
          <section className="overflow-hidden rounded-3xl border border-white bg-white/75 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.35)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-extrabold text-slate-900">{title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {section === 'usuarios' ? `${rows.length} cuentas` : section === 'roles' ? `${rows.length} roles` : `${rows.length} recursos`}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${canWrite ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {canWrite ? 'Acceso de gestion' : 'Solo lectura'}
              </span>
            </div>
            <AdminList
              section={section}
              rows={rows}
              canWrite={canWrite}
              roles={roles}
              resources={resources}
              loading={loading}
              forbidden={forbidden}
              onEdit={beginEdit}
              onDelete={remove}
            />
          </section>

          {canWrite && (
            <AdminForm
              section={section}
              title={title}
              draft={draft}
              setDraft={setDraft}
              editingId={editingId}
              saving={saving}
              roles={roles}
              resources={resources}
              onSubmit={save}
              onReset={reset}
              onToggle={toggleId}
            />
          )}
        </div>
      </main>
    </div>
  )
}