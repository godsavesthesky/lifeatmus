import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticker } from '@/components/Ticker'
import { EventIndex } from '@/components/EventIndex'
import { PlaylistCard } from '@/components/PlaylistCard'
import { Reveal } from '@/components/Reveal'
import { AvatarStack } from '@/components/AvatarStack'
import { StatusBadge } from '@/components/Badge'
import { JoinButton, RegisterButton } from '@/components/JoinButton'
import { ErrorNote, Loading } from '@/components/States'
import { useAuth } from '@/lib/auth'
import { useEvents } from '@/hooks/useEvents'
import { fetchPlaylist } from '@/lib/events'
import type { WeeklyPlaylist } from '@/types'
import {
  costLabel,
  confirmedAttendees,
  effectiveStatus,
  formatDateLong,
  isoDate,
  spellCount,
  timeRange,
  weekDays,
  weekRangeLabel,
} from '@/lib/format'

export function Home() {
  const { session } = useAuth()
  const { events, loading, error, reload, joined, toggleJoin } = useEvents()
  const [playlist, setPlaylist] = useState<WeeklyPlaylist | null>(null)

  useEffect(() => {
    // Playlist tidak menghalangi apa pun: kalau gagal diambil, bagiannya
    // cukup tidak muncul. Tidak perlu membuat seluruh beranda gagal.
    fetchPlaylist()
      .then(setPlaylist)
      .catch(() => setPlaylist(null))
  }, [])

  const { thisWeek, upcoming } = useMemo(() => {
    const days = weekDays(new Date()).map(isoDate)
    const first = days[0]
    const last = days[6]
    const today = isoDate(new Date())

    return {
      thisWeek: events.filter((e) => e.date >= first && e.date <= last),
      upcoming: events.filter((e) => e.date >= today),
    }
  }, [events])

  const nextUp = upcoming[0]
  const people = new Set(thisWeek.flatMap((e) => confirmedAttendees(e).map((a) => a.userId))).size

  return (
    <div>
      {/* ── Judul ───────────────────────────────────────────────────────────
          Angka jumlah acara ditulis sebagai kata dan diambil dari data, jadi
          judulnya benar-benar melaporkan keadaan minggu ini, bukan slogan
          yang selalu sama. */}
      <section className="mx-auto max-w-[1400px] px-5 pb-14 pt-16 md:px-10 md:pb-20 md:pt-24">
        <h1 className="font-display text-mega uppercase text-cream">
          <span className="mask-line">
            <span className="block animate-riseIn">
              {loading ? 'Memuat' : thisWeek.length === 0 ? 'Belum ada' : `Ada ${spellCount(thisWeek.length)}`}
            </span>
          </span>
          <span className="mask-line">
            <span className="block animate-riseIn [animation-delay:110ms]">acara minggu</span>
          </span>
          <span className="mask-line">
            <span className="block animate-riseIn [animation-delay:220ms] text-lime">ini.</span>
          </span>
        </h1>

        <div className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm text-muted md:mt-12">
          <span className="tnum text-cream">{weekRangeLabel()}</span>
          <span>{people} orang sudah menandai kehadiran</span>
          <Link to="/agenda" className="link-sweep text-lime">
            Lihat agenda per hari
          </Link>
        </div>

        {error && <ErrorNote message={error} onRetry={reload} />}
      </section>

      <Ticker events={upcoming} />

      {/* ── Indeks ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-huge uppercase text-cream">Minggu ini</h2>
          <Link to="/events" className="link-sweep shrink-0 text-sm text-cream/70 hover:text-lime">
            Semua acara
          </Link>
        </div>

        {loading ? <Loading label="Mengambil jadwal…" /> : <EventIndex events={thisWeek} />}
      </section>

      {/* ── Sorotan acara terdekat ──────────────────────────────────────────
          Satu-satunya blok yang muncul saat digulir, dan satu-satunya judul
          yang keluar dari kolomnya menimpa gambar. Cuma ada satu supaya
          tetap terasa berani. */}
      {nextUp && (
        <Reveal as="section" className="mx-auto max-w-[1400px] px-5 pb-20 md:px-10 md:pb-28">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="grain relative aspect-[4/3] overflow-hidden md:col-span-7">
              <img src={nextUp.coverImageUrl} alt="" className="h-full w-full object-cover" />
            </div>

            <div className="relative z-10 md:col-span-5 md:-ml-24 md:pt-8">
              <p className="mb-3 text-sm text-lime">Paling dekat</p>

              <h3 className="font-display text-huge uppercase text-cream">
                <Link to={`/events/${nextUp.id}`} className="transition-colors hover:text-lime">
                  {nextUp.title}
                </Link>
              </h3>

              <div className="tnum mt-5 space-y-1 text-sm text-cream/80">
                <p>
                  {formatDateLong(nextUp.date)}, {timeRange(nextUp)}
                </p>
                <p className="text-muted">{nextUp.locationName}</p>
                <p>{costLabel(nextUp)}</p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                {/* Belum login: cuma angkanya yang boleh muncul. Siapa
                    saja yang ikut (nama/foto) baru terlihat setelah masuk —
                    ditegakkan juga di RLS (migrasi 0006), bukan cuma di sini. */}
                {session && <AvatarStack attendees={confirmedAttendees(nextUp)} max={4} />}
                <span className="text-sm text-muted">{confirmedAttendees(nextUp).length} orang ikut</span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                {session ? (
                  <JoinButton
                    joined={joined(nextUp)}
                    full={
                      !!nextUp.maxAttendees && confirmedAttendees(nextUp).length >= nextUp.maxAttendees
                    }
                    onToggle={() => toggleJoin(nextUp)}
                  />
                ) : (
                  <Link
                    to="/login"
                    className="self-start bg-lime px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-limedim"
                  >
                    Masuk untuk ikut
                  </Link>
                )}
                {nextUp.eventType === 'external' &&
                  effectiveStatus(nextUp) === 'open' &&
                  nextUp.externalRegistrationUrl && (
                    <RegisterButton url={nextUp.externalRegistrationUrl} />
                  )}
              </div>

              <div className="mt-5">
                <StatusBadge status={effectiveStatus(nextUp)} />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {playlist && (
        <section className="mx-auto max-w-[1400px] px-5 md:px-10">
          <PlaylistCard playlist={playlist} />
        </section>
      )}
    </div>
  )
}