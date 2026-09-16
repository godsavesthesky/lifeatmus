import { useMemo, useState } from 'react'
import { EventCard } from '@/components/EventCard'
import { ErrorNote, Empty, Loading } from '@/components/States'
import { useEvents } from '@/hooks/useEvents'
import { effectiveStatus } from '@/lib/format'
import type { Category, EventType, RegistrationStatus } from '@/types'

const CATEGORIES: Category[] = ['Meeting', 'Workshop', 'Sharing', 'Sports', 'Social', 'Event', 'Other']

type Filter = { type: EventType | 'all'; category: Category | 'all'; status: RegistrationStatus | 'all' }

export function Events() {
  const { events, loading, error, reload } = useEvents()
  const [query, setQuery] = useState('')
  const [f, setF] = useState<Filter>({ type: 'all', category: 'all', status: 'all' })

  // Penyaringan tetap dilakukan di sisi klien: jumlah acara kantor tidak
  // akan pernah sampai ribuan, dan menyaring di memori membuat filter terasa
  // seketika tanpa satu pun permintaan jaringan tambahan.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (q && !`${e.title} ${e.locationName} ${e.organizerName}`.toLowerCase().includes(q)) return false
      if (f.type !== 'all' && e.eventType !== f.type) return false
      if (f.category !== 'all' && e.category !== f.category) return false
      if (f.status !== 'all' && effectiveStatus(e) !== f.status) return false
      return true
    })
  }, [events, query, f])

  const active = f.type !== 'all' || f.category !== 'all' || f.status !== 'all' || query !== ''

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
      <h1 className="font-display text-huge uppercase text-cream">Jelajah acara</h1>

      {/* Kotak pencarian tanpa bingkai penuh — hanya satu garis di bawahnya,
          diperbesar sesuai perannya sebagai jalan masuk utama halaman ini. */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama acara, tempat, atau penyelenggara"
        className="mt-8 w-full border-b border-rule bg-transparent pb-3 text-lg text-cream placeholder:text-muted focus:border-lime focus:outline-none"
      />

      <div className="mt-6 flex flex-col gap-3">
        <PillRow
          value={f.type}
          onChange={(v) => setF((p) => ({ ...p, type: v as Filter['type'] }))}
          options={[
            ['all', 'Semua jenis'],
            ['internal', 'Acara kantor'],
            ['external', 'Acara luar'],
          ]}
        />
        <PillRow
          value={f.status}
          onChange={(v) => setF((p) => ({ ...p, status: v as Filter['status'] }))}
          options={[
            ['all', 'Semua status'],
            ['open', 'Pendaftaran dibuka'],
            ['closed', 'Ditutup'],
            ['not_required', 'Datang saja'],
          ]}
        />
        <PillRow
          value={f.category}
          onChange={(v) => setF((p) => ({ ...p, category: v as Filter['category'] }))}
          options={[['all', 'Semua kategori'], ...CATEGORIES.map((c) => [c, c] as [string, string])]}
        />
      </div>

      <div className="mt-8 flex items-baseline gap-4 border-b border-line pb-4 text-sm text-muted">
        <span className="tnum">{filtered.length} acara</span>
        {active && (
          <button
            onClick={() => {
              setQuery('')
              setF({ type: 'all', category: 'all', status: 'all' })
            }}
            className="link-sweep text-lime"
          >
            Hapus semua filter
          </button>
        )}
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}

      {loading ? (
        <Loading label="Mengambil daftar acara…" />
      ) : filtered.length === 0 ? (
        // Layar kosong sebagai ajakan bertindak, bukan sekadar pemberitahuan.
        active ? (
          <Empty
            title="Tidak ada yang cocok"
            hint="Coba longgarkan filternya, atau cari dengan kata yang lebih pendek."
          />
        ) : (
          <Empty
            title="Belum ada acara"
            hint="Acara yang dibuat admin akan muncul di sini."
          />
        )
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}

function PillRow({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([val, label]) => {
        const on = val === value
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            aria-pressed={on}
            className={`px-3.5 py-1.5 text-sm transition-colors duration-200 ${
              on
                ? 'bg-lime text-ink'
                : 'border border-line text-cream/70 hover:border-cream/40 hover:text-cream'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
