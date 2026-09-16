import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { EventRecord } from '@/types'
import { confirmedAttendees, effectiveStatus, formatDateShort } from '@/lib/format'

/**
 * Daftar event sebagai indeks bernomor, bukan grid kartu.
 *
 * Kenapa indeks: isinya memang urutan kronologis, jadi nomor di sini
 * membawa informasi, bukan hiasan. Dan untuk membandingkan enam acara dalam
 * satu minggu, baris sejajar jauh lebih cepat dipindai daripada kartu yang
 * masing-masing berdiri sendiri.
 *
 * Gambar cover hanya muncul saat kursor menyentuh barisnya, mengambang
 * mengikuti pointer. Di layar sentuh gambar ini tidak pernah muncul —
 * karena itu setiap baris tetap memuat semua informasi pentingnya sendiri.
 */
export function EventIndex({ events }: { events: EventRecord[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  function handleMove(e: React.MouseEvent) {
    const box = containerRef.current?.getBoundingClientRect()
    const preview = previewRef.current
    if (!box || !preview) return

    // Posisi ditulis langsung ke style, bukan lewat state React. Menyetel
    // state tiap pergerakan mouse akan me-render ulang seluruh daftar
    // puluhan kali per detik dan gerakannya jadi tersendat.
    preview.style.transform = `translate3d(${e.clientX - box.left - 150}px, ${
      e.clientY - box.top - 110
    }px, 0)`
  }

  const active = events.find((e) => e.id === hovered)

  if (events.length === 0) {
    return (
      <p className="border-t border-rule py-16 text-center text-sm text-muted">
        Belum ada acara minggu ini. Kalau kamu punya rencana, ajukan ke admin.
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHovered(null)}
      className="relative"
    >
      {/* Pratinjau mengambang. Disembunyikan dari pembaca layar dan tidak
          pernah menerima pointer, supaya tidak mencuri hover barisnya. */}
      <div
        ref={previewRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-20 hidden w-[300px] lg:block ${
          active ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300 ease-studio`}
      >
        {active && (
          <div className="grain relative aspect-[4/3] overflow-hidden">
            <img src={active.coverImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <ol className="border-t border-rule">
        {events.map((event, i) => {
          const isOpen = effectiveStatus(event) === 'open'
          const going = confirmedAttendees(event).length

          return (
            <li key={event.id} className="border-b border-line">
              <Link
                to={`/events/${event.id}`}
                onMouseEnter={() => setHovered(event.id)}
                onFocus={() => setHovered(null)}
                className="group flex items-baseline gap-4 py-5 transition-[padding] duration-500 ease-studio hover:pl-4 md:gap-8 md:py-7"
              >
                <span className="tnum w-7 shrink-0 text-xs text-muted transition-colors group-hover:text-lime">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <h3 className="font-display min-w-0 flex-1 text-loud uppercase text-cream transition-colors duration-300 group-hover:text-lime">
                  {event.title}
                </h3>

                <span className="hidden w-32 shrink-0 text-sm text-muted sm:block">
                  {event.locationName}
                </span>

                <span className="tnum w-24 shrink-0 text-right text-sm text-cream/80 md:w-32">
                  {formatDateShort(event.date)}
                  <span className="ml-2 text-muted">{event.startTime}</span>
                </span>

                <span className="tnum hidden w-20 shrink-0 text-right text-xs text-muted md:block">
                  {going > 0 ? `${going} ikut` : isOpen ? 'belum ada' : '—'}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}