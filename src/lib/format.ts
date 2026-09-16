import type { EventRecord } from '@/types'

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}

export function costLabel(event: EventRecord): string {
  if (event.costType === 'free') return 'Gratis'
  if (event.costType === 'registration_fee') return `Biaya daftar ${formatRupiah(event.cost)}`
  return `Iuran ${formatRupiah(event.cost)}`
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export function timeRange(event: EventRecord): string {
  return `${event.startTime}–${event.endTime}`
}

/** Status pendaftaran sebenarnya, dengan memperhitungkan batas waktu tutup. */
export function effectiveStatus(event: EventRecord): EventRecord['registrationStatus'] {
  if (event.registrationStatus === 'open' && event.registrationCloseAt) {
    if (new Date(event.registrationCloseAt).getTime() < Date.now()) return 'closed'
  }
  return event.registrationStatus
}

export function confirmedAttendees(event: EventRecord) {
  return event.attendees.filter((a) => a.status === 'confirmed')
}

/** Dipakai judul beranda: "Ada enam acara minggu ini." */
export function spellCount(n: number): string {
  const words = [
    'nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh',
    'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas',
  ]
  return words[n] ?? String(n)
}
/** Senin pada minggu yang memuat tanggal tertentu. */
export function mondayOf(d: Date): Date {
  const copy = new Date(d)
  const day = (copy.getDay() + 6) % 7 // Senin = 0, Minggu = 6
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/**
 * Tanggal dalam bentuk YYYY-MM-DD menurut waktu setempat.
 * Sengaja tidak memakai toISOString(): fungsi itu mengubah ke UTC dan di
 * zona WIB hasilnya bisa mundur satu hari.
 */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** Tujuh tanggal, Senin sampai Minggu, untuk minggu yang memuat `d`. */
export function weekDays(d: Date): Date[] {
  const start = mondayOf(d)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(day.getDate() + i)
    return day
  })
}

/** Contoh: "15 — 21 SEPTEMBER 2026". */
export function weekRangeLabel(d: Date = new Date()): string {
  const days = weekDays(d)
  const first = days[0]
  const last = days[6]
  const monthYear = last.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  return `${first.getDate()} — ${last.getDate()} ${monthYear}`.toUpperCase()
}
