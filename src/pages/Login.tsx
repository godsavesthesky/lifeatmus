import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function Login() {
  const { session, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await signIn(email, password)
    setSubmitting(false)

    if (res.error) {
      // Pesan mentah dari Supabase berbahasa Inggris dan terdengar teknis.
      // Yang paling sering muncul diterjemahkan; sisanya ditampilkan apa
      // adanya daripada disembunyikan di balik pesan umum yang tidak menolong.
      const raw = res.error.toLowerCase()
      setError(
        raw.includes('invalid login')
          ? 'Email atau kata sandi tidak cocok. Coba lagi.'
          : raw.includes('email not confirmed')
            ? 'Email ini belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasinya.'
            : res.error
      )
    } else {
      navigate((location.state as { from?: string })?.from ?? '/', { replace: true })
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
          Agenda kantor, siapa saja yang ikut, dan playlist minggu ini ada di balik sini.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-7">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-b border-rule bg-transparent pb-2 text-lg text-cream focus:border-lime focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Kata sandi</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-b border-rule bg-transparent pb-2 text-lg text-cream focus:border-lime focus:outline-none"
          />
        </label>

        {error && (
          <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start bg-lime px-8 py-3.5 font-medium text-ink transition-colors hover:bg-limedim disabled:opacity-50"
        >
          {submitting ? 'Sebentar…' : 'Masuk'}
        </button>

        <p className="text-sm text-muted">
          Belum punya akun?{' '}
          <Link to="/daftar" className="link-sweep text-lime">
            Daftar di sini
          </Link>
        </p>
      </form>
    </div>
  )
}
