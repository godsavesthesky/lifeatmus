import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryChip } from '@/components/Badge'
import { AvatarStack } from '@/components/AvatarStack'
import { JoinButton } from '@/components/JoinButton'
import { ErrorNote, Loading } from '@/components/States'
import { useEvents } from '@/hooks/useEvents'
import { confirmedAttendees, isoDate, mondayOf, timeRange } from '@/lib/format'
import type { EventRecord } from '@/types'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export function WeeklyAgenda() {
  const { events, loading, error, reload, joined, toggleJoin } = useEvents()
  const [offset, setOffset] = useState(0)

  // Tujuh hari, bukan lima. Versi sebelumnya berhenti di Jumat, sehingga
  // acara akhir pekan seperti lari malam Sabtu tidak pernah muncul di sini.
  const days = useMemo(() => {
    const start = mondayOf(new Date())
    start.setDate(start.getDate() + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [offset])

  const range = `${days[0].getDate()}–${days[6].getDate()} ${days[6].toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })}`

  const byDay = useMemo(() => {
    const map = new Map<string, EventRecord[]>()
    for (const day of days) map.set(isoDate(day), [])
    for (const event of events) {
      const list = map.get(event.date)
      if (list) list.push(event)
    }
    return map
  }, [days, events])

  const total = [...byDay.values()].reduce((n, list) => n + list.length, 0)

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-huge uppercase text-cream">Agenda</h1>
          <p className="tnum mt-2 text-sm text-muted">
            {range} · {loading ? 'memuat…' : `${total} acara`}
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <button onClick={() => setOffset((o) => o - 1)} className="link-sweep text-cream/70 hover:text-lime">
            Minggu sebelumnya
          </button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)} className="link-sweep text-lime">
              Kembali ke minggu ini
            </button>
          )}
          <button onClick={() => setOffset((o) => o + 1)} className="link-sweep text-cream/70 hover:text-lime">
            Minggu berikutnya
          </button>
        </div>
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      {loading ? (
        <Loading label="Menyusun agenda…" />
      ) : (
        /* Satu baris per hari, sama di semua ukuran layar. Tabel tujuh kolom
           memaksa kartu menyempit sampai judulnya tidak terbaca; baris
           bertumpuk membuat hari kosong hanya makan sedikit ruang dan hari
           padat bisa melebar sesuai isinya. */
        <div className="border-t border-rule">
          {days.map((d) => {
            const key = isoDate(d)
            const list = byDay.get(key) ?? []
            const isToday = key === isoDate(new Date())

            return (
              <div key={key} className="grid gap-4 border-b border-line py-6 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                  <p className={`font-display text-loud uppercase ${isToday ? 'text-lime' : 'text-cream'}`}>
                    {DAY_NAMES[(d.getDay() + 6) % 7]}
                  </p>
                  <p className="tnum text-sm text-muted">
                    {d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    {isToday && <span className="ml-2 text-lime">hari ini</span>}
                  </p>
                </div>

                <div className="md:col-span-9">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted">Kosong</p>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {list.map((e) => (
                        <AgendaRow
                          key={e.id}
                          event={e}
                          joined={joined(e)}
                          onToggle={() => toggleJoin(e)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AgendaRow({
  event,
  joined,
  onToggle,
}: {
  event: EventRecord
  joined: boolean
  onToggle: () => void
}) {
  const attendees = confirmedAttendees(event)
  const full = !!event.maxAttendees && attendees.length >= event.maxAttendees

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="tnum w-24 shrink-0 text-sm text-lime">{timeRange(event)}</span>

      <Link
        to={`/events/${event.id}`}
        className="min-w-0 flex-1 font-display text-loud uppercase text-cream transition-colors hover:text-lime"
      >
        {event.title}
      </Link>

      <CategoryChip category={event.category} />
      <AvatarStack attendees={attendees} max={3} />
      <JoinButton size="sm" joined={joined} full={full} onToggle={onToggle} />
    </div>
  )
}
