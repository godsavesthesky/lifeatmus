import { useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function Login() {
  const { session, signInWithGoogle, loading } = useAuth()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleGoogleLogin() {
    setError(null)
    setSubmitting(true)
    // Ini juga sekaligus jadi cara "daftar": kalau ini kali pertama akun
    // Google ini dipakai, Supabase membuat barisnya sendiri lalu trigger
    // handle_new_user langsung mengisi profil — tidak ada langkah terpisah.
    // Setelah ini, Supabase mengarahkan browser keluar ke Google, jadi
    // `submitting` cuma sempat kelihatan sesaat kecuali ada error.
    const res = await signInWithGoogle()
    if (res.error) {
      setError(res.error)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
      <div>
        <h1 className="font-display text-mega uppercase text-cream">
          <span className="mask-line">
            <span className="block animate-riseIn">Masuk</span>
          </span>
          <span className="mask-line">
            <span className="block animate-riseIn [animation-delay:110ms] text-lime">dulu.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-[42ch] text-muted">
          Agenda kantor, siapa saja yang ikut, dan playlist minggu ini ada di balik sini. Belum
          punya akun? Masuk dengan Google saja — otomatis dibuatkan.
        </p>
      </div>

      <div className="flex max-w-sm flex-col gap-7">
        {error && (
          <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="flex items-center justify-center gap-3 self-start bg-lime px-8 py-3.5 font-medium text-ink transition-colors hover:bg-limedim disabled:opacity-50"
        >
          <GoogleIcon />
          {submitting ? 'Mengarahkan…' : 'Masuk dengan Google'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}