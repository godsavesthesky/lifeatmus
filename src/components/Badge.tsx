import type { RegistrationStatus } from '@/types'

/**
 * Penanda status pendaftaran.
 *
 * Hanya status "buka" yang mendapat warna lime — itu satu-satunya yang
 * menuntut tindakan. Sisanya sengaja dibuat sunyi. Kalau semua penanda
 * berwarna terang, tidak ada yang menonjol dan warnanya berhenti berarti.
 */
export function StatusBadge({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; className: string }> = {
    open: { label: 'Pendaftaran dibuka', className: 'bg-lime text-ink' },
    closed: { label: 'Pendaftaran ditutup', className: 'text-muted border border-line' },
    not_required: { label: 'Datang saja', className: 'text-cream/70 border border-line' },
  }
  const { label, className } = map[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function TypeBadge({ type }: { type: 'external' | 'internal' }) {
  return (
    <span className="inline-flex items-center border border-cream/30 bg-ink/50 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">
      {type === 'external' ? 'Acara luar' : 'Acara kantor'}
    </span>
  )
}

export function CategoryChip({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center border border-line px-2.5 py-1 text-xs text-muted">
      {category}
    </span>
  )
}