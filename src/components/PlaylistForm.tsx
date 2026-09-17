import { useState, type FormEvent } from 'react'
import type { PlaylistInput } from '@/lib/events'
import { humanError, uploadEventCoverImage } from '@/lib/events'
import type { WeeklyPlaylist } from '@/types'
import { isoDate, mondayOf, weekRangeLabel } from '@/lib/format'

/** Nilai awal untuk playlist baru: minggu berjalan, label otomatis. */
function blank(): PlaylistInput {
  const weekStart = isoDate(mondayOf(new Date()))
  return {
    weekStart,
    weekLabel: weekRangeLabel(new Date()),
    title: '',
    curatorName: '',
    coverImageUrl: '',
    appleMusicUrl: '',
  }
}

function fromPlaylist(p: WeeklyPlaylist): PlaylistInput {
  return {
    weekStart: p.weekStart,
    weekLabel: p.weekLabel,
    title: p.title,
    curatorName: p.curatorName,
    coverImageUrl: p.coverImageUrl,
    appleMusicUrl: p.appleMusicUrl,
  }
}

/**
 * Form playlist mingguan, dipakai untuk playlist baru maupun mengganti
 * playlist minggu yang sudah ada.
 *
 * Admin cuma perlu tempel SATU tautan Apple Music yang biasa di-share dari
 * app-nya (music.apple.com/...). Versi embed untuk pemutar di beranda
 * diturunkan otomatis dari tautan itu di `lib/events.ts` — jadi admin tidak
 * perlu tahu bedanya embed.music.apple.com vs music.apple.com.
 */
export function PlaylistForm({
  playlist,
  onSubmit,
  onClose,
}: {
  playlist?: WeeklyPlaylist
  onSubmit: (input: PlaylistInput) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<PlaylistInput>(playlist ? fromPlaylist(playlist) : blank())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Label minggu cuma diisi otomatis selama admin belum pernah menulisnya
  // sendiri — begitu playlist lama dibuka untuk diubah, labelnya dianggap
  // sudah "disentuh" dan tidak ditimpa lagi saat tanggal diganti.
  const [labelTouched, setLabelTouched] = useState(Boolean(playlist))

  function set<K extends keyof PlaylistInput>(key: K, value: PlaylistInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleWeekChange(value: string) {
    set('weekStart', value)
    if (!labelTouched && value) set('weekLabel', weekRangeLabel(new Date(value)))
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // biar bisa pilih file yang sama lagi kalau mau upload ulang
    if (!file) return

    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadEventCoverImage(file)
      set('coverImageUrl', url)
    } catch (err) {
      setUploadError(humanError(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.appleMusicUrl.trim()) {
      setError('Tempel tautan playlist Apple Music dulu.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(humanError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={playlist ? `Ubah playlist ${playlist.title}` : 'Playlist baru'}
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-ink/80 backdrop-blur-sm"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex h-full w-full flex-col overflow-y-auto border-l border-line bg-navy p-6 sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-loud uppercase text-cream">
            {playlist ? 'Ubah playlist' : 'Playlist baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-2xl leading-none text-cream/60 hover:text-cream"
          >
            ×
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <Field label="Minggu (tanggal Senin)">
            <input
              type="date"
              required
              value={form.weekStart}
              onChange={(e) => handleWeekChange(e.target.value)}
              className={inputBox}
            />
          </Field>

          <Field label="Label minggu">
            <input
              value={form.weekLabel}
              onChange={(e) => {
                setLabelTouched(true)
                set('weekLabel', e.target.value)
              }}
              placeholder="15 — 21 SEPTEMBER 2026"
              className={inputLine}
            />
          </Field>

          <Field label="Judul playlist">
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Office Mood: Friday Energy"
              className={inputLine}
            />
          </Field>

          <Field label="Dikurasi oleh">
            <input
              value={form.curatorName}
              onChange={(e) => set('curatorName', e.target.value)}
              placeholder="Tim People"
              className={inputLine}
            />
          </Field>

          <Field label="Gambar sampul">
            <div className="flex flex-col gap-3">
              {form.coverImageUrl && (
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="h-32 w-full border border-line object-cover"
                />
              )}

              <label className="inline-flex w-fit cursor-pointer items-center gap-2 border border-line px-4 py-2 text-sm text-cream transition-colors hover:border-lime">
                {uploading ? 'Mengunggah…' : 'Upload dari komputer'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}

              <input
                type="url"
                placeholder="atau tempel URL gambar di sini"
                value={form.coverImageUrl}
                onChange={(e) => set('coverImageUrl', e.target.value)}
                className={inputLine}
              />
            </div>
          </Field>

          <Field label="Tautan playlist Apple Music">
            <input
              type="url"
              required
              value={form.appleMusicUrl}
              onChange={(e) => set('appleMusicUrl', e.target.value)}
              placeholder="https://music.apple.com/us/playlist/..."
              className={inputLine}
            />
            <p className="mt-2 text-xs text-muted">
              Tempel tautan share biasa dari app Apple Music (bukan yang embed) — versi untuk
              pemutar dibuat otomatis dari tautan ini.
            </p>
          </Field>

          {error && (
            <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-lime px-6 py-3 font-medium text-ink transition-colors hover:bg-limedim disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : playlist ? 'Simpan perubahan' : 'Simpan playlist'}
          </button>
          <button type="button" onClick={onClose} className="link-sweep text-sm text-cream/70">
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

const inputLine =
  'w-full border-b border-line bg-transparent pb-2 text-cream focus:border-lime focus:outline-none'
const inputBox =
  'w-full border border-line bg-ink px-3 py-2 text-cream focus:border-lime focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  )
}