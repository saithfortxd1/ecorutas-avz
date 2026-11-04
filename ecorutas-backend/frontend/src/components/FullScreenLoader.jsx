/** Loader a pantalla completa (usado por Suspense y rutas protegidas). */
export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-200 border-t-eco-600" />
    </div>
  )
}
