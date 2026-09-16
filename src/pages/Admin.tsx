import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEPARTMENTS } from '@/data/departments'
import { useAuth } from '@/lib/auth'
import { useEvents } from '@/hooks/useEvents'
import { EventForm } from '@/components/EventForm'
import { ErrorNote, Loading } from '@/components/States'
import {
  createEvent,
  deleteEvent,
  fetchProfiles,
  humanError,
  updateEvent,
  updateProfile,
  type EventInput,
} from '@/lib/events'
import { confirmedAttendees, effectiveStatus, formatDateShort } from '@/lib/format'
import type { EventRecord, User } from '@/types'

/**
 * Dasbor admin.
 *
 * Semua aksi di sini menulis langsung ke Supabase. Bentuk aksinya sengaja
 * dibuat sama persis dengan yang diizinkan kebijakan RLS di migrasi 0003 dan
 * 0004 — kalau database menolak, pesannya ditampilkan apa adanya daripada
 * dipoles seolah berhasil. UI tidak pernah menjadi gerbangnya.
 */
export function Admin() {
  const { profile, refreshProfile } = useAuth()
  const { events, loading: eventsLoading, error: eventsError, reload: reloadEvents } = useEvents()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [eventForm, setEventForm] = useState<{ open: boolean; event?: EventRecord }>({ open: false })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await fetchProfiles())
      setError(null)
    } catch (err) {
      setError(humanError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const isActive = (u: User) => u.isActive !== false
  const pending = users.filter((u) => !u.departmentVerified && isActive(u))
  const revoked = users.filter((u) => !isActive(u))

  async function patch(id: string, changes: Partial<User>) {
    const before = users
    // Tulis dulu ke layar, kirim ke server sesudahnya. Kalau ditolak,
    // dikembalikan — memutar kembali satu baris jauh lebih baik daripada
    // membuat setiap klik menunggu jaringan.
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)))
    setEditing((cur) => (cur && cur.id === id ? { ...cur, ...changes } : cur))

    try {
      const saved = await updateProfile(id, changes)
      setUsers((prev) => prev.map((u) => (u.id === id ? saved : u)))
      setEditing((cur) => (cur && cur.id === id ? saved : cur))
      setError(null)
      // Kalau yang diubah diri sendiri (misal melepas hak admin), navbar dan
      // penjaga rute harus ikut tahu.
      if (id === profile?.id) await refreshProfile()
    } catch (err) {
      setUsers(before)
      setEditing(before.find((u) => u.id === id) ?? null)
      setError(humanError(err))
    }
  }

  function toggleAccess(u: User) {
    const turningOff = isActive(u)
    // Penjaga yang sama juga ada di database (trigger ensure_admin_remains),
    // tapi mencegahnya di sini membuat orangnya tidak perlu melihat pesan
    // error Postgres untuk sesuatu yang bisa kita jelaskan lebih baik.
    if (turningOff && u.isAdmin && users.filter((x) => x.isAdmin && isActive(x)).length <= 1) {
      setError('Ini admin aktif terakhir. Angkat admin lain dulu sebelum mencabut aksesnya.')
      return
    }
    void patch(u.id, { isActive: !turningOff })
  }

  async function saveEvent(input: EventInput) {
    if (eventForm.event) await updateEvent(eventForm.event.id, input)
    else await createEvent(input, profile!.id)
    await reloadEvents()
  }

  async function removeEvent(event: EventRecord) {
    if (!confirm(`Hapus "${event.title}"? Data kehadirannya ikut terhapus.`)) return
    try {
      await deleteEvent(event.id)
      await reloadEvents()
    } catch (err) {
      setError(humanError(err))
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
      <h1 className="font-display text-huge uppercase text-cream">Admin</h1>

      {error && <ErrorNote message={error} onRetry={loadUsers} />}
      {eventsError && <ErrorNote message={eventsError} onRetry={reloadEvents} />}

      <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        <Stat value={users.filter(isActive).length} label="Anggota aktif" />
        <Stat value={events.length} label="Acara terdaftar" />
        <Stat
          value={events.filter((e) => effectiveStatus(e) === 'open').length}
          label="Pendaftaran dibuka"
        />
        <Stat
          value={events.reduce((n, e) => n + confirmedAttendees(e).length, 0)}
          label="Total kehadiran"
        />
      </div>

      {/* ── Pendaftar baru ─────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-loud uppercase text-cream">Pendaftar baru</h2>
          <p className="mt-2 max-w-[62ch] text-sm text-muted">
            Karena pendaftaran terbuka untuk email apa pun, periksa dulu apakah orang ini memang
            rekan kantor dan divisinya benar. Kalau bukan, cabut aksesnya.
          </p>

          <ul className="mt-5 divide-y divide-line border-y border-rule">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-[180px] flex-1">
                  <p className="text-cream">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>

                <select
                  value={u.department}
                  onChange={(e) => patch(u.id, { department: e.target.value as User['department'] })}
                  className="border border-line bg-ink px-3 py-2 text-sm text-cream focus:border-lime focus:outline-none"
                >
                  <option value="Unassigned">Belum ditentukan</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => patch(u.id, { departmentVerified: true })}
                  className="bg-lime px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-limedim"
                >
                  Setujui
                </button>
                <button onClick={() => toggleAccess(u)} className="link-sweep text-sm text-red-300">
                  Cabut akses
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Acara ──────────────────────────────────────────────────────── */}
      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-loud uppercase text-cream">Acara</h2>
          <button
            onClick={() => setEventForm({ open: true })}
            className="bg-lime px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-limedim"
          >
            Tambah acara
          </button>
        </div>

        {eventsLoading ? (
          <Loading label="Mengambil acara…" />
        ) : events.length === 0 ? (
          <p className="mt-5 border-y border-rule py-10 text-sm text-muted">
            Belum ada acara sama sekali. Tekan “Tambah acara” untuk mengisi yang pertama.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto border-y border-rule">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="py-3 pr-4 font-normal">Acara</th>
                  <th className="py-3 pr-4 font-normal">Tanggal</th>
                  <th className="py-3 pr-4 font-normal">Status</th>
                  <th className="py-3 pr-4 font-normal">Ikut</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3.5 pr-4">
                      <Link to={`/events/${e.id}`} className="text-cream hover:text-lime">
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {e.eventType === 'external' ? 'Acara luar' : 'Acara kantor'} · {e.category}
                      </p>
                    </td>
                    <td className="tnum py-3.5 pr-4 text-muted">
                      {formatDateShort(e.date)} {e.startTime}
                    </td>
                    <td className="py-3.5 pr-4 text-muted">
                      {
                        {
                          open: 'Dibuka',
                          closed: 'Ditutup',
                          not_required: 'Datang saja',
                        }[effectiveStatus(e)]
                      }
                    </td>
                    <td className="tnum py-3.5 pr-4 text-muted">
                      {confirmedAttendees(e).length}
                      {e.maxAttendees ? ` / ${e.maxAttendees}` : ''}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setEventForm({ open: true, event: e })}
                        className="link-sweep text-lime"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => removeEvent(e)}
                        className="link-sweep ml-4 text-red-300"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Anggota ────────────────────────────────────────────────────── */}
      <section className="mt-16">
        <h2 className="font-display text-loud uppercase text-cream">Anggota</h2>

        {loading ? (
          <Loading label="Mengambil anggota…" />
        ) : (
          <div className="mt-5 overflow-x-auto border-y border-rule">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="py-3 pr-4 font-normal">Nama</th>
                  <th className="py-3 pr-4 font-normal">Divisi</th>
                  <th className="py-3 pr-4 font-normal">Status</th>
                  <th className="py-3 pr-4 font-normal">Akses</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className={isActive(u) ? '' : 'opacity-45'}>
                    <td className="py-3.5 pr-4">
                      <p className="text-cream">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-muted">
                      {u.department}
                      {!u.departmentVerified && (
                        <span className="ml-2 text-xs text-lime">belum disetujui</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-muted">
                      {u.role === 'intern' ? 'Magang' : 'Karyawan'}
                      {u.isAdmin && <span className="ml-2 text-lime">admin</span>}
                    </td>
                    <td className="py-3.5 pr-4">
                      {isActive(u) ? (
                        <span className="text-cream/70">Aktif</span>
                      ) : (
                        <span className="text-red-300">Dicabut</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <button onClick={() => setEditing(u)} className="link-sweep text-lime">
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {revoked.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            {revoked.length} orang aksesnya dicabut. Mereka masih bisa masuk, tapi tidak akan
            melihat data apa pun sampai diaktifkan lagi.
          </p>
        )}
      </section>

      {editing && (
        <EditPanel
          user={editing}
          onClose={() => setEditing(null)}
          onChange={(changes) => patch(editing.id, changes)}
          onToggleAccess={() => toggleAccess(editing)}
        />
      )}

      {eventForm.open && (
        <EventForm
          event={eventForm.event}
          onSubmit={saveEvent}
          onClose={() => setEventForm({ open: false })}
        />
      )}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-ink p-5">
      <p className="tnum font-display text-5xl text-lime">{String(value).padStart(2, '0')}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

function EditPanel({
  user,
  onClose,
  onChange,
  onToggleAccess,
}: {
  user: User
  onClose: () => void
  onChange: (changes: Partial<User>) => void
  onToggleAccess: () => void
}) {
  const active = user.isActive !== false
  const [name, setName] = useState(user.name)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ubah data ${user.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-ink/80 backdrop-blur-sm"
    >
      {/* Panel geser dari kanan, bukan kotak di tengah: mengubah data orang
          sering perlu melirik tabel di belakangnya. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col overflow-y-auto border-l border-line bg-navy p-6 sm:max-w-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-loud uppercase text-cream">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-2xl leading-none text-cream/60 hover:text-cream"
          >
            ×
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">Nama</span>
            {/* Nama disimpan saat kolomnya ditinggalkan, bukan tiap ketikan —
                kalau tidak, satu nama berarti belasan permintaan ke server. */}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== user.name && onChange({ name })}
              className="border-b border-line bg-transparent pb-2 text-cream focus:border-lime focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">Divisi</span>
            <select
              value={user.department}
              onChange={(e) => onChange({ department: e.target.value as User['department'] })}
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
              value={user.role}
              onChange={(e) => onChange({ role: e.target.value as User['role'] })}
              className="border border-line bg-ink px-3 py-2 text-cream focus:border-lime focus:outline-none"
            >
              <option value="employee">Karyawan</option>
              <option value="intern">Magang</option>
            </select>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={user.departmentVerified}
              onChange={(e) => onChange({ departmentVerified: e.target.checked })}
              className="h-4 w-4 accent-lime"
            />
            <span className="text-sm text-cream">Divisi sudah diperiksa</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={user.isAdmin}
              onChange={(e) => onChange({ isAdmin: e.target.checked })}
              className="h-4 w-4 accent-lime"
            />
            <span className="text-sm text-cream">Beri hak admin</span>
          </label>
        </div>

        <div className="mt-auto border-t border-line pt-6">
          <p className="mb-3 text-sm text-muted">
            {active
              ? 'Mencabut akses membuat orang ini tidak bisa melihat data apa pun, tanpa menghapus riwayat kehadirannya di acara lama.'
              : 'Akses dicabut. Mengaktifkan kembali memulihkan semuanya seperti semula.'}
          </p>
          <button
            onClick={onToggleAccess}
            className={`w-full border px-5 py-3 font-medium transition-colors ${
              active
                ? 'border-red-400/60 text-red-300 hover:bg-red-400 hover:text-ink'
                : 'border-lime text-lime hover:bg-lime hover:text-ink'
            }`}
          >
            {active ? 'Cabut akses' : 'Aktifkan kembali'}
          </button>
        </div>
      </div>
    </div>
  )
}
