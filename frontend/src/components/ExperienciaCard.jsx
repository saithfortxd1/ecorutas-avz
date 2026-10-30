import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Leaf, MapPin, Pencil, Trash2, UserRound } from 'lucide-react'
import { getExperienceImageInfo, getExperienceImageSrcSet } from '../utils/experienceImages.js'
import { formatCurrencyCOP } from '../utils/formatters.js'

export default function ExperienciaCard({ experiencia, canManage, onEdit, onDelete, index = 0 }) {
  const { titulo, descripcion, precioTexto, estado, categoriaNombre, anfitrionUsername } = experiencia
  const imageInfo = getExperienceImageInfo(experiencia)
  const [image, setImage] = useState(() => imageInfo.url)
  const reduceMotion = useReducedMotion()
  const position = Number.isFinite(Number(experiencia.latitud)) && Number.isFinite(Number(experiencia.longitud))
    ? `${Number(experiencia.latitud).toFixed(3)}, ${Number(experiencia.longitud).toFixed(3)}`
    : ''

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.38, delay: reduceMotion ? 0 : Math.min(index % 3, 2) * 0.055 }}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-stone-200/80 bg-white shadow-[0_12px_34px_-28px_rgba(24,46,34,.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-28px_rgba(24,46,34,.55)]"
    >
      <div className="relative aspect-[1.48] overflow-hidden bg-eco-100">
        {image ? <img
          src={image}
          srcSet={getExperienceImageSrcSet(image)}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none"
          loading={index < 3 ? 'eager' : 'lazy'}
          fetchpriority={index === 0 ? 'high' : 'auto'}
          decoding="async"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1399px) 33vw, 25vw"
          onError={() => setImage(undefined)}
        /> : <div aria-hidden="true" className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#dce8d7,#f1ead9)] text-eco-800"><Leaf size={26} strokeWidth={1.4} /><span className="text-xs font-semibold tracking-wide">EcoRutas</span></div>}
        <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 truncate rounded-full border border-white/70 bg-[#fffdf7]/95 px-3 py-1.5 text-xs font-semibold text-eco-800 shadow-sm">
          <Leaf size={13} aria-hidden="true" />{categoriaNombre}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-eco-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">{estado}</span>
        {imageInfo.credit && image && <a href={imageInfo.source} target="_blank" rel="noreferrer noopener" className="absolute bottom-3 left-3 max-w-[72%] truncate rounded-md bg-eco-950/75 px-2 py-1 text-[0.62rem] font-medium text-white/95 backdrop-blur-sm hover:bg-eco-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`Crédito de imagen: ${imageInfo.credit}`}>
          {imageInfo.credit}
        </a>}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-5">
        <h2 className="line-clamp-2 min-h-[3.5rem] font-display text-[1.3rem] leading-7 text-eco-950">{titulo}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">{descripcion}</p>

        <div className="mt-4 flex min-h-5 items-center gap-1.5 text-xs text-stone-500">
          {position && <><MapPin size={14} className="shrink-0 text-eco-700" aria-hidden="true" /><span>Coordenadas {position}</span></>}
        </div>
        {anfitrionUsername && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-eco-800"><UserRound size={14} aria-hidden="true" />Anfitrión @{anfitrionUsername}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-100 pt-4">
          <p className="leading-tight text-stone-500"><span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em]">Precio</span><strong className="mt-1 inline-block text-xl font-bold text-eco-900">{formatCurrencyCOP(experiencia.precio ?? precioTexto)}</strong></p>
          {!canManage && <span className="text-xs text-stone-500">Precio publicado</span>}
          {canManage && <div className="flex gap-2">
            <button type="button" onClick={() => onEdit(experiencia)} aria-label={`Editar ${titulo}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:border-eco-700 hover:text-eco-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"><Pencil size={14} />Editar</button>
            <button type="button" onClick={() => onDelete(experiencia)} aria-label={`Eliminar ${titulo}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-100 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"><Trash2 size={14} />Eliminar</button>
          </div>}
        </div>
      </div>
    </motion.article>
  )
}
