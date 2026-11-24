import { Pencil, Trash2 } from 'lucide-react'

function ActionButton({ children, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  )
}

function labelsFrom(source, ids) {
  return source
    .filter((item) => (ids || []).includes(item.id))
    .map((item) => item.nombre)
    .join(', ')
}

/**
 * Lista de registros de una seccion administrativa.
 * Las acciones Editar/Eliminar solo se muestran si `canWrite` es true.
 */
export default function AdminList({ section, rows, canWrite, roles, resources, loading, forbidden, onEdit, onDelete }) {
  if (loading) return <p className="p-8 text-sm text-slate-500">Cargando informacion...</p>
  if (forbidden) return <p className="p-8 text-sm text-amber-700">No tienes permisos para ver esta seccion.</p>

  const emptyText = {
    usuarios: 'No hay usuarios registrados.',
    roles: 'No hay roles configurados.',
    recursos: 'No hay recursos configurados.',
  }[section]

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          {section === 'usuarios' && (
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-800">
                {item.first_name} {item.last_name} <span className="font-medium text-slate-500">@{item.username}</span>
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {item.email || 'Sin correo'} · {labelsFrom(roles, item.roles) || 'Sin roles'}
              </p>
            </div>
          )}

          {section === 'roles' && (
            <div>
              <p className="font-bold text-slate-800">{item.nombre}</p>
              <p className="mt-1 text-xs text-slate-500">{labelsFrom(resources, item.recursos) || 'Sin recursos'}</p>
            </div>
          )}

          {section === 'recursos' && (
            <div>
              <p className="font-bold text-slate-800">{item.nombre}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.path || 'Recurso de API'} · {(item.permisos || []).length} reglas
              </p>
            </div>
          )}

          {canWrite && (
            <div className="flex">
              <ActionButton onClick={() => onEdit(item)}>
                <Pencil size={14} />Editar
              </ActionButton>
              <ActionButton
                danger
                disabled={(section === 'usuarios' && item.username === 'admin') || (section === 'roles' && item.nombre === 'Administrador')}
                onClick={() => onDelete(item)}
              >
                <Trash2 size={14} />Eliminar
              </ActionButton>
            </div>
          )}
        </div>
      ))}
      {!rows.length && <p className="p-8 text-sm text-slate-500">{emptyText}</p>}
    </div>
  )
}