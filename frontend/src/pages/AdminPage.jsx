import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Layers3, Pencil, Plus, Save, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../components/Navbar.jsx'
import { recursosAdmin, rolesAdmin, usuariosAdmin } from '../services/rbacService.js'

const SECTIONS = [
  { key: 'usuarios', title: 'Usuarios', path: '/admin/usuarios', icon: Users },
  { key: 'roles', title: 'Roles', path: '/admin/roles', icon: ShieldCheck },
  { key: 'recursos', title: 'Recursos', path: '/admin/recursos', icon: Layers3 },
]

const EMPTY = {
  usuarios: { username: '', email: '', first_name: '', last_name: '', password: '', roles: [], is_active: true },
  roles: { nombre: '', recursos: [] },
  recursos: { nombre: '', path: '', icono: 'grid', permisos: [] },
}

function selectedSection(pathname) {
  return SECTIONS.find((section) => section.path === pathname)?.key || 'usuarios'
}

function ActionButton({ children, onClick, danger = false, disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}>
      {children}
    </button>
  )
}

export default function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const section = selectedSection(location.pathname)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [resources, setResources] = useState([])
  const [draft, setDraft] = useState(EMPTY[section])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const title = useMemo(() => SECTIONS.find((item) => item.key === section)?.title ?? 'Administración', [section])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userRows, roleRows, resourceRows] = await Promise.all([
        usuariosAdmin.list(), rolesAdmin.list(), recursosAdmin.list(),
      ])
      setUsers(userRows)
      setRoles(roleRows)
      setResources(resourceRows)
    } catch {
      toast.error('No se pudieron cargar los datos administrativos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setDraft(EMPTY[section])
    setEditingId(null)
  }, [section])

  const beginEdit = (item) => {
    setEditingId(item.id)
    if (section === 'usuarios') setDraft({ ...item, password: '', roles: item.roles || [] })
    else if (section === 'roles') setDraft({ nombre: item.nombre, recursos: item.recursos || [] })
    else setDraft({ ...item, permisos: item.permisos || [] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => { setDraft(EMPTY[section]); setEditingId(null) }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (section === 'usuarios') {
        const payload = { ...draft, roles: draft.roles.map(Number) }
        if (editingId && !payload.password) delete payload.password
        if (editingId) await usuariosAdmin.update(editingId, payload)
        else await usuariosAdmin.create(payload)
      } else if (section === 'roles') {
        const payload = { ...draft, recursos: draft.recursos.map(Number) }
        if (editingId) await rolesAdmin.update(editingId, payload)
        else await rolesAdmin.create(payload)
      } else {
        const payload = { ...draft, permisos: typeof draft.permisos === 'string' ? JSON.parse(draft.permisos) : draft.permisos }
        if (editingId) await recursosAdmin.update(editingId, payload)
        else await recursosAdmin.create(payload)
      }
      toast.success(editingId ? `${title} actualizado correctamente` : `${title} creado correctamente`)
      reset()
      await load()
    } catch (error) {
      if (error instanceof SyntaxError) toast.error('El JSON de permisos no tiene un formato válido.')
      else toast.error('No se pudo guardar. Revisa los campos e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (section === 'usuarios' && item.username === 'admin') {
      toast.error('No se puede eliminar la cuenta administradora activa.')
      return
    }
    if (section === 'roles' && item.nombre === 'Administrador') {
      toast.error('El rol base Administrador está protegido.')
      return
    }
    if (!window.confirm(`¿Eliminar ${item.nombre || item.username}?`)) return
    try {
      if (section === 'usuarios') await usuariosAdmin.remove(item.id)
      else if (section === 'roles') await rolesAdmin.remove(item.id)
      else await recursosAdmin.remove(item.id)
      toast.success(`${title} eliminado correctamente`)
      if (editingId === item.id) reset()
      await load()
    } catch {
      toast.error('No se pudo eliminar este registro.')
    }
  }

  const toggleId = (key, id) => setDraft((current) => {
    const values = current[key].map(Number)
    return { ...current, [key]: values.includes(Number(id)) ? values.filter((value) => value !== Number(id)) : [...values, Number(id)] }
  })

  const resourceLabels = (ids) => resources.filter((resource) => ids.includes(resource.id)).map((resource) => resource.nombre).join(', ')

  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Control de acceso</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Gestión de {title.toLowerCase()}</h1><p className="mt-2 text-sm text-slate-600">Administra las cuentas y los permisos que construyen la experiencia EcoRutas.</p></div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/75 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm"><KeyRound size={15} /> RBAC relacional activo</span>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white bg-white/65 p-2 shadow-sm backdrop-blur-md" aria-label="Módulos administrativos">
          {SECTIONS.map(({ key, path, title: tabTitle, icon: Icon }) => (
            <button key={key} type="button" onClick={() => navigate(path)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${section === key ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}>
              <Icon size={17} />{tabTitle}
            </button>
          ))}
        </nav>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-3xl border border-white bg-white/75 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.35)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-extrabold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{section === 'usuarios' ? `${users.length} cuentas` : section === 'roles' ? `${roles.length} roles` : `${resources.length} recursos`}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Acceso autorizado</span></div>
            {loading ? <p className="p-8 text-sm text-slate-500">Cargando información…</p> : section === 'usuarios' ? (
              <div className="divide-y divide-slate-100">
                {users.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate font-bold text-slate-800">{item.first_name} {item.last_name} <span className="font-medium text-slate-500">@{item.username}</span></p><p className="mt-1 truncate text-xs text-slate-500">{item.email || 'Sin correo'} · {resourceLabels(item.roles) || 'Sin roles'}</p></div><div className="flex"><ActionButton onClick={() => beginEdit(item)}><Pencil size={14} />Editar</ActionButton><ActionButton danger disabled={item.username === 'admin'} onClick={() => remove(item)}><Trash2 size={14} />Eliminar</ActionButton></div></div>)}
                {!users.length && <p className="p-8 text-sm text-slate-500">No hay usuarios registrados.</p>}
              </div>
            ) : section === 'roles' ? (
              <div className="divide-y divide-slate-100">
                {roles.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div><p className="font-bold text-slate-800">{item.nombre}</p><p className="mt-1 text-xs text-slate-500">{resourceLabels(item.recursos) || 'Sin recursos'}</p></div><div className="flex"><ActionButton onClick={() => beginEdit(item)}><Pencil size={14} />Editar</ActionButton><ActionButton danger disabled={item.nombre === 'Administrador'} onClick={() => remove(item)}><Trash2 size={14} />Eliminar</ActionButton></div></div>)}
                {!roles.length && <p className="p-8 text-sm text-slate-500">No hay roles configurados.</p>}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {resources.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div><p className="font-bold text-slate-800">{item.nombre}</p><p className="mt-1 text-xs text-slate-500">{item.path || 'Recurso de API'} · {(item.permisos || []).length} reglas</p></div><div className="flex"><ActionButton onClick={() => beginEdit(item)}><Pencil size={14} />Editar</ActionButton><ActionButton danger onClick={() => remove(item)}><Trash2 size={14} />Eliminar</ActionButton></div></div>)}
                {!resources.length && <p className="p-8 text-sm text-slate-500">No hay recursos configurados.</p>}
              </div>
            )}
          </section>

          <form onSubmit={save} className="h-fit rounded-3xl border border-white bg-white/80 p-5 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">{editingId ? 'Editar registro' : 'Nuevo registro'}</p><h2 className="mt-1 text-lg font-extrabold text-slate-900">{editingId ? 'Actualizar' : 'Crear'} {title.toLowerCase().replace(/s$/, '')}</h2></div>{editingId ? <button type="button" onClick={reset} aria-label="Cancelar edición" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button> : <Plus size={19} className="text-emerald-700" />}</div>

            {section === 'usuarios' ? <div className="mt-5 space-y-3">
              <Input label="Usuario" value={draft.username} onChange={(value) => setDraft({ ...draft, username: value })} required />
              <Input label="Correo" type="email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
              <div className="grid grid-cols-2 gap-3"><Input label="Nombre" value={draft.first_name || ''} onChange={(value) => setDraft({ ...draft, first_name: value })} /><Input label="Apellido" value={draft.last_name || ''} onChange={(value) => setDraft({ ...draft, last_name: value })} /></div>
              <Input label={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" value={draft.password || ''} onChange={(value) => setDraft({ ...draft, password: value })} required={!editingId} />
              <CheckList title="Roles asignados" options={roles.map((item) => ({ id: item.id, name: item.nombre }))} values={draft.roles} onToggle={(id) => toggleId('roles', id)} />
            </div> : section === 'roles' ? <div className="mt-5 space-y-3">
              <Input label="Nombre del rol" value={draft.nombre} onChange={(value) => setDraft({ ...draft, nombre: value })} required />
              <CheckList title="Recursos asignados" options={resources.map((item) => ({ id: item.id, name: item.nombre }))} values={draft.recursos} onToggle={(id) => toggleId('recursos', id)} />
            </div> : <div className="mt-5 space-y-3">
              <Input label="Nombre del recurso" value={draft.nombre} onChange={(value) => setDraft({ ...draft, nombre: value })} required />
              <Input label="Ruta del frontend" value={draft.path} onChange={(value) => setDraft({ ...draft, path: value })} placeholder="/admin/usuarios" />
              <Input label="Icono Lucide" value={draft.icono} onChange={(value) => setDraft({ ...draft, icono: value })} required />
              <label className="block text-xs font-bold text-slate-600">Reglas de API (JSON)<textarea rows={8} value={typeof draft.permisos === 'string' ? draft.permisos : JSON.stringify(draft.permisos, null, 2)} onChange={(event) => setDraft({ ...draft, permisos: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
            </div>}

            <div className="mt-6 flex gap-2"><button disabled={saving} type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-60"><Save size={16} />{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear'}</button>{editingId && <button type="button" onClick={reset} className="rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>}</div>
          </form>
        </div>
      </main>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return <label className="block text-xs font-bold text-slate-600">{label}<input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
}

function CheckList({ title, options, values, onToggle }) {
  const selected = (values || []).map(Number)
  return <fieldset><legend className="mb-2 text-xs font-bold text-slate-600">{title}</legend><div className="max-h-40 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2">{options.map((option) => <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"><input type="checkbox" checked={selected.includes(Number(option.id))} onChange={() => onToggle(option.id)} className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600" />{option.name}</label>)}{!options.length && <p className="px-2 py-1 text-xs text-slate-400">Aún no hay opciones.</p>}</div></fieldset>
}
