/**
 * Tiga keadaan yang muncul di hampir setiap halaman sejak data diambil dari
 * server: sedang memuat, gagal, dan kosong. Dikumpulkan di satu tempat supaya
 * bunyinya sama di seluruh aplikasi — bukan "Loading…" di satu halaman dan
 * "Sedang memuat data" di halaman lain.
 */

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-20 text-sm text-muted">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
      {label}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="my-6 border-l-2 border-red-400 pl-4 py-1">
      <p className="text-sm text-red-300">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="link-sweep mt-2 text-sm text-lime">
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-loud uppercase text-cream">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  )
}
