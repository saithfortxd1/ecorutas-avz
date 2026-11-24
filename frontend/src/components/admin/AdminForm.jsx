import { Plus, Save, X } from 'lucide-react'

function Input({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  )
}

function CheckList({ title, options, values, onToggle }) {
  const selected = (values || []).map(Number)
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-slate-600">{title}</legend>
      <div className="max-h-40 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2">
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">
            <input
              type="checkbox"
              checked={selected.includes(Number(option.id))}
              onChange={() => onToggle(option.id)}
              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            {option.name}
          </label>
        ))}
        {!options.length && <p className="px-2 py-1 text-xs text-slate-400">Aun no hay opciones.</p>}
      </div>
    </fieldset>
  )
}

/** Formulario de creacion/edicion de una seccion administrativa. */
export default function AdminForm({ section, title, draft, setDraft, editingId, saving, roles, resources, onSubmit, onReset, onToggle }) {
  return (
    <form onSubmit={onSubmit} className="h-fit rounded-3xl border border-white bg-white/80 p-5 shadow-[0_18px_55px_-36px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
            {editingId ? 'Editar registro' : 'Nuevo registro'}
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            {editingId ? 'Actualizar' : 'Crear'} {title.toLowerCase().replace(/s$/, '')}
          </h2>
        </div>
        {editingId ? (
          <button type="button" onClick={onReset} aria-label="Cancelar edicion" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X size={17} />
          </button>
        ) : (
          <Plus size={19} className="text-emerald-700" />
        )}
      </div>

      {section === 'usuarios' && (
        <div className="mt-5 space-y-3">
          <Input label="Usuario" value={draft.username} onChange={(value) => setDraft({ ...draft, username: value })} required />
          <Input label="Correo" type="email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={draft.first_name || ''} onChange={(value) => setDraft({ ...draft, first_name: value })} />
            <Input label="Apellido" value={draft.last_name || ''} onChange={(value) => setDraft({ ...draft, last_name: value })} />
          </div>
          <Input
            label={editingId ? 'Nueva contrasena (opcional)' : 'Contrasena'}
            type="password"
            value={draft.password || ''}
            onChange={(value) => setDraft({ ...draft, password: value })}
            required={!editingId}
          />
          <CheckList
            title="Roles asignados"
            options={roles.map((item) => ({ id: item.id, name: item.nombre }))}
            values={draft.roles}
            onToggle={(id) => onToggle('roles', id)}
          />
        </div>
      )}

      {section === 'roles' && (
        <div className="mt-5 space-y-3">
          <Input label="Nombre del rol" value={draft.nombre} onChange={(value) => setDraft({ ...draft, nombre: value })} required />
          <CheckList
            title="Recursos asignados"
            options={resources.map((item) => ({ id: item.id, name: item.nombre }))}
            values={draft.recursos}
            onToggle={(id) => onToggle('recursos', id)}
          />
        </div>
      )}

      {section === 'recursos' && (
        <div className="mt-5 space-y-3">
          <Input label="Nombre del recurso" value={draft.nombre} onChange={(value) => setDraft({ ...draft, nombre: value })} required />
          <Input label="Ruta del frontend" value={draft.path} onChange={(value) => setDraft({ ...draft, path: value })} placeholder="/admin/usuarios" />
          <Input label="Icono Lucide" value={draft.icono} onChange={(value) => setDraft({ ...draft, icono: value })} required />
          <label className="block text-xs font-bold text-slate-600">
            Reglas de API (JSON)
            <textarea
              rows={8}
              value={typeof draft.permisos === 'string' ? draft.permisos : JSON.stringify(draft.permisos, null, 2)}
              onChange={(event) => setDraft({ ...draft, permisos: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          disabled={saving}
          type="submit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear'}
        </button>
        {editingId && (
          <button type="button" onClick={onReset} className="rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}