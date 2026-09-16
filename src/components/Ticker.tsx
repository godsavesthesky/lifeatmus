import type { EventRecord } from '@/types'
import { formatDateShort } from '@/lib/format'

/**
 * Pita berjalan berisi jadwal minggu ini.
 *
 * Isinya dirender dua kali berdampingan; animasinya menggeser seluruh rel
 * sejauh -50%, tepat satu salinan, sehingga saat kembali ke posisi nol
 * gambarnya identik dan sambungannya tidak terlihat. Salinan kedua diberi
 * aria-hidden supaya pembaca layar tidak membacakan jadwal yang sama dua kali.
 *
 * Berhenti saat disentuh kursor atau saat ada yang di-fokus di dalamnya,
 * jadi teks yang lewat masih bisa dibaca dengan tenang.
 */
export function Ticker({ events }: { events: EventRecord[] }) {
  if (events.length === 0) return null

  const items = events.map((e) => ({
    id: e.id,
    label: e.title,
    meta: `${formatDateShort(e.date)} ${e.startTime}`,
  }))

  const Run = ({ hidden = false }: { hidden?: boolean }) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <span key={it.id} className="flex items-center whitespace-nowrap">
          <span className="font-display text-3xl uppercase tracking-tight text-ink/90">
            {it.label}
          </span>
          <span className="tnum mx-4 text-xs font-medium text-ink/55">{it.meta}</span>
          <Asterisk className="mr-4 h-3 w-3 shrink-0 text-ink/40" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="ticker overflow-hidden border-y border-ink/10 bg-lime py-2.5">
      <div className="ticker-track animate-marquee">
        <Run />
        <Run hidden />
      </div>
    </div>
  )
}

function Asterisk({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}