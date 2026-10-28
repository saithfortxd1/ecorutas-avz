/**
 * Tarjeta de una experiencia (recibe un modelo de UI ya normalizado).
 * Las acciones Editar/Eliminar solo se muestran si `canManage`
 * (rol anfitrion y propietario del registro).
 */
export default function ExperienciaCard({ experiencia, canManage, onEdit, onDelete }) {
  const { titulo, descripcion, precioTexto, latitud, longitud, estado, categoriaNombre, anfitrionUsername } =
    experiencia

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <span className="mb-3 inline-block w-fit rounded-full bg-eco-50 px-2.5 py-1 text-xs font-semibold text-eco-700">
        {categoriaNombre}
      </span>

      <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">{descripcion}</p>

      <dl className="mt-4 space-y-1 text-xs text-slate-500">
        <div>Ubicación: {latitud}, {longitud}</div>
        <div>Estado: {estado}</div>
        {anfitrionUsername && <div className="font-semibold text-eco-700">Anfitrión: @{anfitrionUsername}</div>}
      </dl>

      <p className="mt-3 text-xl font-extrabold text-eco-700">{precioTexto} € / persona</p>

      {canManage && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(experiencia)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(experiencia)}
            className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      )}
    </article>
  )
}
