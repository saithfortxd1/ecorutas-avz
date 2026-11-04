import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, Compass, Globe2, Leaf, Map, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  {
    title: 'Naturaleza, con respeto',
    text: 'Explora experiencias de bajo impacto creadas para cuidar cada sendero, río y ecosistema.',
    icon: Leaf,
    tone: 'bg-emerald-100 text-emerald-800',
  },
  {
    title: 'Rutas con historia local',
    text: 'Descubre el territorio desde la mirada de quienes lo conocen y lo protegen todos los días.',
    icon: Compass,
    tone: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Valor para la comunidad',
    text: 'Cada encuentro conecta viajeros responsables con anfitriones y economías locales.',
    icon: Users,
    tone: 'bg-sky-100 text-sky-800',
  },
]

const STEPS = [
  { n: '01', title: 'Encuentra tu ruta', text: 'Filtra experiencias por categoría y encuentra tu próximo destino.' },
  { n: '02', title: 'Conecta con anfitriones', text: 'Conoce a las personas que hacen especial cada lugar.' },
  { n: '03', title: 'Viaja con propósito', text: 'Vive algo memorable dejando una huella más ligera.' },
]

const fadeUp = (reduced, delay = 0) => ({
  initial: reduced ? false : { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: reduced ? 0 : 0.65, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
})

export default function LandingPage() {
  const { isAuthenticated, isAnfitrion, menu } = useAuth()
  const reducedMotion = useReducedMotion()
  const canExplore = menu.some((item) => item.path === '/experiencias')
  const exploreHref = isAuthenticated ? '/experiencias' : '/login'

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f2] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/35 bg-slate-950/35 px-5 py-3 text-white shadow-lg shadow-slate-950/10 backdrop-blur-md sm:px-7" aria-label="Navegación principal">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300 text-emerald-950"><Leaf size={20} /></span>
            EcoRutas
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 sm:inline-flex">Iniciar sesión</Link>
                <Link to="/registro" className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-200">
                  Registrarse <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <Link to={canExplore ? '/experiencias' : '/'} className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-lime-200">
                {canExplore ? 'Mis experiencias' : 'EcoRutas'} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </nav>
      </header>

      <section className="relative isolate flex min-h-[760px] items-center bg-emerald-950 pb-24 pt-32 text-white sm:min-h-[820px]">
        <img
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2400&q=88"
          alt="Montañas verdes cubiertas por la neblina al amanecer"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/90 via-emerald-950/65 to-emerald-950/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-950/65 via-transparent to-emerald-950/20" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.15fr_.85fr]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-200 backdrop-blur-md sm:text-sm">
              <Sparkles size={15} /> Viaja más cerca de lo esencial
            </span>
            <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              El mundo se siente distinto <span className="text-lime-300">a pie.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Encuentra rutas guiadas por anfitriones locales, respira naturaleza y descubre historias que no aparecen en los mapas de siempre.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to={exploreHref} className="group inline-flex items-center gap-3 rounded-full bg-lime-300 px-6 py-3.5 text-sm font-extrabold text-emerald-950 shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-lime-200">
                {isAuthenticated && canExplore ? 'Explorar Experiencias' : isAuthenticated ? 'Ver opciones de acceso' : 'Explorar Experiencias'}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950/10 transition group-hover:translate-x-1"><ArrowRight size={16} /></span>
              </Link>
              {!isAuthenticated && <Link to="/login" className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">Iniciar Sesión</Link>}
            </div>
            {isAnfitrion && <p className="mt-5 text-sm text-lime-100">Tu conocimiento del territorio puede inspirar la próxima ruta.</p>}
            <div className="mt-12 flex items-center gap-4 text-sm text-white/75">
              <div className="flex -space-x-2" aria-hidden="true">
                {['bg-lime-200', 'bg-amber-200', 'bg-sky-200', 'bg-rose-200'].map((color, index) => <span key={index} className={`h-8 w-8 rounded-full border-2 border-emerald-950 ${color}`} />)}
              </div>
              <span><strong className="text-white">Pequeños grupos.</strong> Grandes recuerdos.</span>
            </div>
          </motion.div>

          <motion.aside
            initial={reducedMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.85, delay: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden justify-self-end lg:block"
          >
            <div className="w-[320px] rounded-[2rem] border border-white/25 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md xl:w-[360px]">
              <div className="relative h-48 overflow-hidden rounded-[1.5rem]">
                <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85" alt="Viajero contemplando un paisaje natural" className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-900"><Leaf size={13} /> Con anfitrión local</span>
              </div>
              <div className="flex items-start justify-between gap-4 px-1 pt-5">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-200">Tu próxima aventura</p><h2 className="mt-2 text-xl font-extrabold">Respira, explora, conecta.</h2></div>
                <span className="rounded-2xl bg-lime-300 p-3 text-emerald-950"><Map size={20} /></span>
              </div>
              <p className="mt-3 px-1 text-sm leading-6 text-white/70">Experiencias auténticas para descubrir la naturaleza con otra mirada.</p>
            </div>
          </motion.aside>
        </div>

        <a href="#proposito" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/65 transition hover:text-white">
          Descubre <ArrowDown size={16} className="animate-bounce" />
        </a>
      </section>

      <section id="proposito" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <motion.div {...fadeUp(reducedMotion)} className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Una forma más consciente de viajar</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">La mejor ruta también cuida el camino.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">Creemos que los viajes memorables nacen cuando la naturaleza y las comunidades locales están en el centro de la experiencia.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ title, text, icon: Icon, tone }, index) => (
            <motion.article key={title} {...fadeUp(reducedMotion, index * 0.1)} className="rounded-[1.75rem] border border-white bg-white/75 p-7 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.25)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-[0_25px_60px_-32px_rgba(15,23,42,0.3)]">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon size={22} strokeWidth={1.8} /></span>
              <h3 className="mt-6 text-xl font-extrabold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-[#e8efe5] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <motion.div {...fadeUp(reducedMotion)}>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Así comienza</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Tres pasos. Un recuerdo que se queda.</h2>
            <p className="mt-5 max-w-md leading-7 text-slate-600">De la primera búsqueda al último paisaje, cada detalle está pensado para que disfrutes el viaje con tranquilidad.</p>
            <div className="mt-7 flex items-center gap-2 text-sm font-bold text-emerald-800"><ShieldCheck size={18} /> Experiencias seleccionadas con cuidado</div>
          </motion.div>
          <div className="space-y-3">
            {STEPS.map((step, index) => (
              <motion.article key={step.n} {...fadeUp(reducedMotion, index * 0.1)} className="flex gap-5 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-md sm:gap-6 sm:p-6">
                <span className="text-sm font-black tracking-widest text-emerald-700">{step.n}</span>
                <div><h3 className="font-extrabold text-slate-900">{step.title}</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">{step.text}</p></div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-emerald-950 px-5 py-10 text-center text-sm text-white/60">
        <div className="mb-3 inline-flex items-center gap-2 font-bold text-white"><Globe2 size={17} className="text-lime-300" /> EcoRutas</div>
        <p>Descubre con respeto. Conecta de verdad. · {new Date().getFullYear()}</p>
      </footer>
    </main>
  )
}
