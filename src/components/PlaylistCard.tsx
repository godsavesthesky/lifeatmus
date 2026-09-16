import { useState } from 'react'
import type { WeeklyPlaylist } from '@/types'

/**
 * Playlist mingguan. Pemutarnya tidak dimuat sampai ada yang menekan
 * tombolnya — iframe Apple Music berat, dan sebagian besar orang membuka
 * beranda untuk melihat jadwal, bukan mendengarkan musik.
 */
export function PlaylistCard({ playlist }: { playlist: WeeklyPlaylist }) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="border-t border-rule pt-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="grain relative h-28 w-28 shrink-0 overflow-hidden">
          <img src={playlist.coverImageUrl} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm text-muted">Playlist minggu ini</p>
          <h3 className="font-display text-loud uppercase text-cream">{playlist.title}</h3>
          <p className="mt-1 text-sm text-muted">{playlist.curatorName}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-5">
          <button
            onClick={() => setPlaying((v) => !v)}
            aria-expanded={playing}
            className="border border-cream px-6 py-3 text-sm font-medium text-cream transition-colors hover:border-lime hover:bg-lime hover:text-ink"
          >
            {playing ? 'Tutup pemutar' : 'Putar di sini'}
          </button>
          <a
            href={playlist.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-sweep text-sm text-cream/70 hover:text-lime"
          >
            Buka di Apple Music
          </a>
        </div>
      </div>

      {playing && (
        <div className="mt-6">
          <iframe
            allow="autoplay *; encrypted-media *;"
            height="175"
            loading="lazy"
            style={{ width: '100%', overflow: 'hidden', background: 'transparent', border: 0 }}
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            src={playlist.appleMusicEmbedUrl}
            title={playlist.title}
          />
        </div>
      )}
    </section>
  )
}