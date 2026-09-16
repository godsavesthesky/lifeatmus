import { Link } from 'react-router-dom'
import type { EventRecord } from '@/types'
import { StatusBadge } from './Badge'
import { AvatarStack } from './AvatarStack'
import { useAuth } from '@/lib/auth'
import { costLabel, confirmedAttendees, effectiveStatus, formatDateShort } from '@/lib/format'

/**
 * Kartu event untuk halaman jelajah.
 *
 * Bedanya dengan versi lama: tidak ada bingkai mengelilingi seluruh kartu.
 * Gambar berdiri sendiri, teks duduk di bawahnya tanpa kotak, dan satu-
 * satunya garis adalah pemisah antara isi dan baris bawah. Bingkai yang
 * sama di setiap kartu membuat halaman terlihat seperti kisi kosong;
 * menghapusnya membuat gambar dan judulnya yang membentuk ritme.
 */
export function EventCard({ event }: { event: EventRecord }) {
  const { session } = useAuth()
  const attendees = confirmedAttendees(event)

  return (
    <Link to={`/events/${event.id}`} className="group flex flex-col">
      <div className="grain relative aspect-[5/4] overflow-hidden bg-navy">
        <img
          src={event.coverImageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-studio group-hover:scale-[1.06]"
        />
        <span className="absolute left-3 top-3">
          <StatusBadge status={effectiveStatus(event)} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="tnum flex items-baseline gap-3 text-xs text-muted">
          <span className="text-lime">{formatDateShort(event.date)}</span>
          <span>{event.startTime}</span>
          <span className="truncate">{event.locationName}</span>
        </div>

        <h3 className="font-display text-loud uppercase text-cream transition-colors duration-300 group-hover:text-lime">
          {event.title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-sm text-cream/80">{costLabel(event)}</span>
          {attendees.length === 0 ? (
            <span className="text-xs text-muted">Belum ada yang ikut</span>
          ) : session ? (
            <AvatarStack attendees={attendees} max={3} />
          ) : (
            // Belum login: cuma angkanya, nama/foto disembunyikan.
            <span className="text-xs text-muted">{attendees.length} orang ikut</span>
          )}
        </div>
      </div>
    </Link>
  )
}