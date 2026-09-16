import type { EventAttendee } from '@/types'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function AvatarStack({
  attendees,
  max = 4,
  size = 'sm',
}: {
  attendees: EventAttendee[]
  max?: number
  size?: 'sm' | 'md'
}) {
  const shown = attendees.slice(0, max)
  const extra = attendees.length - shown.length
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-xs'

  return (
    <div className="flex -space-x-2">
      {shown.map((a) =>
        // avatarUrl bertipe opsional, jadi jangan langsung dipasang ke <img>:
        // tanpa penjagaan ini hasilnya ikon gambar rusak, bukan ruang kosong.
        a.user.avatarUrl ? (
          <img
            key={a.id}
            src={a.user.avatarUrl}
            alt={a.user.name}
            title={a.user.name}
            className={`${dim} rounded-full border-2 border-ink object-cover`}
          />
        ) : (
          <span
            key={a.id}
            title={a.user.name}
            className={`${dim} flex items-center justify-center rounded-full border-2 border-ink bg-navy font-medium text-cream`}
          >
            {initials(a.user.name)}
          </span>
        )
      )}

      {extra > 0 && (
        <span
          className={`${dim} flex items-center justify-center rounded-full border-2 border-ink bg-lime font-medium text-ink`}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}