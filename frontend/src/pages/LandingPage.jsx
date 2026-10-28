import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  {
    titulo: 'Turismo ecológico',
    texto:
      'Experiencias al aire libre que respetan los ecosistemas: senderismo, kayak, avistamiento de aves y más, con impacto mínimo.',
    icono: '🌿',
  },
  {
    titulo: 'Rutas sostenibles',
    texto:
      'Itinerarios diseñados para cuidar el entorno y las comunidades locales, priorizando la conservación sobre el volumen.',
    icono: '🥾',
  },
  {
    titulo: 'Anfitriones locales',
    texto:
      'Conectamos turistas con anfitriones de la zona que conocen el territorio y ofrecen experiencias auténticas.',
    icono: '🤝',
  },
]

const PASOS = [
  { n: 1, titulo: 'Crea tu cuenta', texto: 'Regístrate como turista para explorar, o como anfitrión para publicar.' },
  { n: 2, titulo: 'Explora el catálogo', texto: 'Busca y filtra experiencias por precio, ubicación y categoría.' },
  { n: 3, titulo: 'Reserva y disfruta', texto: 'Consulta disponibilidad y vive rutas sostenibles de la mano de locales.' },
]

export default function LandingPage() {
  const { isAuthenticated, isAnfitrion } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-extrabold text-eco-700">EcoRutas</span>
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/experiencias"
              className="rounded-lg bg-eco-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-eco-700"
            >
              Ir a mis experiencias
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-eco-700">
                Iniciar Sesión
              </Link>
              <Link
                to="/registro"
                className="rounded-lg bg-eco-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-eco-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-700 via-eco-600 to-eco-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Turismo ecológico y sostenible
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Descubre rutas sostenibles y conecta con anfitriones locales
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-eco-50">
            EcoRutas es la plataforma que une a viajeros responsables con anfitriones de comunidades locales,
            ofreciendo experiencias de ecoturismo auténticas y de bajo impacto ambiental.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/experiencias"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-eco-700 transition hover:bg-eco-50"
            >
              Explorar Experiencias
            </Link>
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  className="rounded-lg bg-eco-900/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-eco-900/60"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {isAnfitrion && (
            <p className="mt-4 text-sm text-eco-50">
              Tienes rol de <strong>Anfitrión</strong>: ya puedes publicar tus propias experiencias.
            </p>
          )}
        </div>
      </section>

      {/* Qué es EcoRutas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-slate-800">¿Qué es EcoRutas?</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-slate-500">
          EcoRutas nace para hacer del turismo una herramienta de conservación. Reúne experiencias de naturaleza
          gestionadas por anfitriones locales, fomenta rutas de bajo impacto y reparte el valor en las comunidades
          que cuidan el territorio.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.titulo} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl" aria-hidden="true">{f.icono}</div>
              <h3 className="mt-3 text-lg font-bold text-slate-800">{f.titulo}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-slate-800">¿Cómo funciona?</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PASOS.map((p) => (
              <div key={p.n} className="rounded-2xl bg-eco-50 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eco-600 font-bold text-white">
                  {p.n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">{p.titulo}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/experiencias"
              className="inline-block rounded-lg bg-eco-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-eco-700"
            >
              Explorar Experiencias
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <p className="text-center text-sm text-slate-400">
          EcoRutas · Proyecto de turismo sostenible · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
