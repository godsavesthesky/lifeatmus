import { useEffect, useRef, useState } from 'react'
import type { EventAttendee } from '@/types'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function WhoIsIn({ attendees }: { attendees: EventAttendee[] }) {
  const confirmed = attendees.filter((a) => a.status === 'confirmed')
  const [open, setOpen] = useState(false)
  const preview = confirmed.slice(0, 5)
  const rest = confirmed.length - preview.length

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-loud uppercase text-cream">Siapa saja yang ikut</h2>
        <span className="tnum shrink-0 text-sm text-muted">{confirmed.length} orang</span>
      </div>

      {confirmed.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Belum ada yang menandai kehadiran. Kamu bisa jadi yang pertama.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {preview.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <Avatar attendee={a} />
              <span className="text-sm text-cream">{a.user.name}</span>
              <span className="ml-auto text-sm text-muted">{a.user.department}</span>
            </li>
          ))}
        </ul>
      )}

      {rest > 0 && (
        <button onClick={() => setOpen(true)} className="link-sweep mt-4 text-sm text-lime">
          Lihat {rest} orang lainnya
        </button>
      )}

      {open && <PeopleDialog attendees={confirmed} onClose={() => setOpen(false)} />}
    </section>
  )
}

function Avatar({ attendee }: { attendee: EventAttendee }) {
  return attendee.user.avatarUrl ? (
    <img
      src={attendee.user.avatarUrl}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs text-cream">
      {initials(attendee.user.name)}
    </span>
  )
}

function PeopleDialog({
  attendees,
  onClose,
}: {
  attendees: EventAttendee[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fokus langsung ke kolom pencarian: satu-satunya alasan orang membuka
    // dialog ini adalah mencari nama.
    inputRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Kunci gulir halaman di belakang, kalau tidak halamannya ikut bergerak
    // saat orang menggulir daftar sampai mentok.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? attendees.filter(
        (a) =>
          a.user.name.toLowerCase().includes(q) || a.user.department.toLowerCase().includes(q)
      )
    : attendees

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daftar peserta"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/85 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col border border-line bg-navy sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <h3 className="font-display text-loud uppercase text-cream">
            {attendees.length} orang ikut
          </h3>
          <button onClick={onClose} aria-label="Tutup" className="text-2xl leading-none text-cream/60 hover:text-cream">
            ×
          </button>
        </div>

        <div className="border-b border-line p-5">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau divisi"
            className="w-full border-b border-line bg-transparent pb-2 text-sm text-cream placeholder:text-muted focus:border-lime focus:outline-none"
          />
        </div>

        <ul className="divide-y divide-line overflow-y-auto px-5">
          {filtered.length === 0 && (
            <li className="py-6 text-sm text-muted">Tidak ada nama yang cocok.</li>
          )}
          {filtered.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <Avatar attendee={a} />
              <div className="min-w-0">
                <p className="truncate text-sm text-cream">{a.user.name}</p>
                <p className="truncate text-xs text-muted">{a.user.department}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}