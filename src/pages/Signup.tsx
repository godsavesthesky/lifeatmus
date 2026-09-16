import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { DEPARTMENTS } from '@/data/departments'
import type { Role, User } from '@/types'

/**
 * Halaman daftar.
 *
 * Divisi dan status yang dipilih sendiri di sini TIDAK langsung dipercaya:
 * trigger handle_new_user menyimpannya dengan department_verified = false,
 * dan orangnya muncul di halaman Admin sebagai pendaftar baru yang harus
 * diperiksa. Karena pendaftaran terbuka untuk email apa pun, pemeriksaan itu
 * yang menjadi gerbangnya — bukan formulir ini.
 */
export function Signup() {
  const { session, signUp, loading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState<User['department']>('Unassigned')
  const [role, setRole] = useState<Role>('employee')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  if (!loading && session && !checkEmail) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }

    setSubmitting(true)
    const res = await signUp({ email, password, name, department, role })
    setSubmitting(false)

    if (res.error) {
      const raw = res.error.toLowerCase()
      setError(
        raw.includes('already registered') || raw.includes('already been registered')
          ? 'Email ini sudah terdaftar. Coba masuk saja.'
          : raw.includes('password')
            ? 'Kata sandinya ditolak server. Pakai yang lebih panjang atau lebih acak.'
            : res.error
      )
      return
    }

    // Kalau konfirmasi email menyala di Supabase, sesinya belum terbentuk —
    // menyuruh orangnya "masuk" sekarang cuma akan gagal, jadi jelaskan.
    if (res.needsConfirmation) setCheckEmail(true)
    else navigate('/', { replace: true })
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 md:px-10">
        <h1 className="font-display text-huge uppercase text-cream">Cek emailmu</h1>
        <p className="mt-4 text-muted">
          Kami kirim tautan konfirmasi ke <span className="text-cream">{email}</span>. Klik tautannya,
          lalu masuk seperti biasa.
        </p>
        <Link to="/login" className="link-sweep mt-6 inline-block text-lime">
          Ke halaman masuk
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-12 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
      <div>
        <h1 className="font-display text-mega uppercase text-cream">
          <span className="mask-line">
            <span className="block animate-riseIn">Bikin</span>
          </span>
          <span className="mask-line">
            <span className="block animate-riseIn [animation-delay:110ms] text-lime">akun.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-[42ch] text-muted">
          Pakai email apa pun. Setelah daftar, admin akan memeriksa divisimu dulu sebelum
          ditandai terverifikasi — jadi kalau divisimu belum yakin, pilih “Belum ditentukan”.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-7">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Nama lengkap</span>
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-b border-rule bg-transparent pb-2 text-lg text-cream focus:border-lime focus:outline-none"
          />
        </label>

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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-b border-rule bg-transparent pb-2 text-lg text-cream focus:border-lime focus:outline-none"
          />
          <span className="text-xs text-muted">Minimal 8 karakter.</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Divisi</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as User['department'])}
            className="border border-line bg-ink px-3 py-2 text-cream focus:border-lime focus:outline-none"
          >
            <option value="Unassigned">Belum ditentukan</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Status</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="border border-line bg-ink px-3 py-2 text-cream focus:border-lime focus:outline-none"
          >
            <option value="employee">Karyawan</option>
            <option value="intern">Magang</option>
          </select>
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
          {submitting ? 'Sebentar…' : 'Daftar'}
        </button>

        <p className="text-sm text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="link-sweep text-lime">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  )
}
