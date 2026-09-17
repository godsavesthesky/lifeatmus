import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { DEPARTMENTS } from '@/data/departments'
import type { User } from '@/types'

/**
 * Muncul sekali doang: sesudah login Google pertama kali (profil baru
 * dibuat trigger handle_new_user dengan department = 'Unassigned' dan
 * onboarded = false), sebelum orangnya boleh lihat isi aplikasi.
 *
 * Cuma minta divisi — bukan nama (sudah dari Google) atau status/role
 * (kolom itu dikunci trigger prevent_self_privilege_escalation supaya tidak
 * bisa diubah sendiri lewat UPDATE; admin yang menentukan itu di halaman
 * Admin kalau perlu).
 */
export function Onboarding() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [department, setDepartment] = useState<User['department']>('Unassigned')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && !session) return <Navigate to="/login" replace />
  if (!loading && profile?.onboarded) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    setSubmitting(true)

    const { error } = await supabase
      .from('profiles')
      .update({ department, onboarded: true })
      .eq('id', profile.id)

    if (error) {
      setError('Gagal menyimpan. Coba lagi sebentar lagi.')
      setSubmitting(false)
      return
    }

    await refreshProfile()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-24 md:px-10">
      <h1 className="font-display text-huge uppercase text-cream">Satu langkah lagi.</h1>
      <p className="mt-4 max-w-[42ch] text-muted">
        Divisimu belum diisi. Admin akan memverifikasinya nanti — kalau belum yakin, pilih
        “Belum ditentukan” dulu saja, bisa diubah lagi belakangan.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex max-w-sm flex-col gap-7">
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
          {submitting ? 'Menyimpan…' : 'Lanjut'}
        </button>
      </form>
    </div>
  )
}