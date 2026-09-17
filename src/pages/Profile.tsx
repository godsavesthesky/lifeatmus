import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { DEPARTMENTS } from '@/data/departments'
import type { User } from '@/types'

/**
 * Nama, email, foto — semua dari Google, cuma bisa dilihat di sini, tidak
 * bisa diedit (kalau mau ganti, gantinya di akun Google-nya sendiri).
 * Yang bisa diedit sendiri cuma divisi (kolom lain dikunci trigger
 * prevent_self_privilege_escalation di database, lihat migrasi 0001).
 */
export function Profile() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [department, setDepartment] = useState<User['department']>(profile?.department ?? 'Unassigned')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!profile) return null

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSaved(false)

    // Ganti divisi = perlu diverifikasi ulang admin, sama seperti pengisian
    // pertama kali (lihat migrasi 0003/0008): departmentVerified sengaja
    // direset ke false di sini, bukan cuma saat onboarding.
    const { error } = await supabase
      .from('profiles')
      .update({ department, department_verified: false })
      .eq('id', profile.id)

    if (error) {
      setError('Gagal menyimpan. Coba lagi sebentar lagi.')
      setSaving(false)
      return
    }

    await refreshProfile()
    setSaving(false)
    setSaved(true)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 md:px-10 md:py-24">
      <h1 className="font-display text-huge uppercase text-cream">Profil.</h1>

      <div className="mt-8 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="h-16 w-16 rounded-full border border-line object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-navy text-lg text-cream">
            {profile.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-cream">{profile.name}</p>
          <p className="text-sm text-muted">{profile.email}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        Nama dan foto ikut akun Google-mu — ganti dari sana kalau mau beda.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <span className="border border-line px-3 py-1 text-xs uppercase tracking-wide text-cream/70">
          {profile.role === 'intern' ? 'Intern' : 'Karyawan'}
        </span>
        {profile.isAdmin && (
          <span className="border border-lime/40 bg-lime/10 px-3 py-1 text-xs uppercase tracking-wide text-lime">
            Admin
          </span>
        )}
        <span className="border border-line px-3 py-1 text-xs uppercase tracking-wide text-cream/70">
          {profile.departmentVerified ? 'Divisi terverifikasi' : 'Divisi belum diverifikasi admin'}
        </span>
      </div>

      <div className="mt-8 flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted">Divisi</span>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value as User['department'])
              setSaved(false)
            }}
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
        {saved && <p className="text-sm text-lime">Tersimpan.</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || department === profile.department}
          className="self-start bg-lime px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-limedim disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Menyimpan…' : 'Simpan divisi'}
        </button>
      </div>

      {/* Ini juga jadi satu-satunya tombol keluar yang keliatan di layar
          kecil — di Navbar tombol "Keluar" sengaja disembunyikan di mobile
          (cuma avatar yang tampil), jadi tanpa ini orang yang buka dari HP
          tidak punya cara logout sama sekali. */}
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-12 border border-line px-6 py-2.5 text-sm text-cream/70 transition-colors hover:border-red-400/50 hover:text-red-300"
      >
        Keluar dari akun
      </button>
    </div>
  )
}