import { useState, type FormEvent, type ReactNode } from 'react'
import type { EventInput } from '@/lib/events'
import { humanError } from '@/lib/events'
import type { Category, CostType, EventRecord, EventType, RegistrationStatus } from '@/types'
import { isoDate } from '@/lib/format'

const CATEGORIES: Category[] = ['Meeting', 'Workshop', 'Sharing', 'Sports', 'Social', 'Event', 'Other']

/** Nilai awal untuk acara baru: hari ini, jam kerja, gratis, internal. */
function blank(): EventInput {
  return {
    title: '',
    description: '',
    coverImageUrl: '',
    eventType: 'internal',
    category: 'Meeting',
    date: isoDate(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    organizerName: '',
    organizerDepartment: '',
    locationName: '',
    locationAddress: '',
    googleMapsUrl: '',
    cost: 0,
    costType: 'free',
    registrationStatus: 'not_required',
    registrationOpenAt: '',
    registrationCloseAt: '',
    externalRegistrationUrl: '',
    externalEventUrl: '',
    maxAttendees: undefined,
  }
}

function fromEvent(e: EventRecord): EventInput {
  const { id: _id, attendees: _attendees, createdBy: _createdBy, ...rest } = e
  return { ...rest }
}

/** timestamptz dari database → nilai yang dimengerti <input type="datetime-local">. */
function toLocalInput(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${isoDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Formulir acara, dipakai untuk membuat maupun mengubah.
 *
 * Panel geser dari kanan, sama seperti panel anggota — mengisi acara sering
 * sambil melirik daftar acara yang sudah ada di belakangnya.
 */
export function EventForm({
  event,
  onSubmit,
  onClose,
}: {
  event?: EventRecord
  onSubmit: (input: EventInput) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<EventInput>(event ? fromEvent(event) : blank())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.endTime <= form.startTime) {
      setError('Jam selesai harus setelah jam mulai.')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        ...form,
        // datetime-local memberi waktu setempat tanpa zona; ubah ke ISO
        // lengkap supaya Postgres tidak menebaknya sebagai UTC.
        registrationOpenAt: form.registrationOpenAt
          ? new Date(form.registrationOpenAt).toISOString()
          : undefined,
        registrationCloseAt: form.registrationCloseAt
          ? new Date(form.registrationCloseAt).toISOString()
          : undefined,
      })
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
      aria-label={event ? `Ubah ${event.title}` : 'Acara baru'}
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
            {event ? 'Ubah acara' : 'Acara baru'}
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
          <Field label="Judul">
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Deskripsi">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${inputBox} resize-y`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis">
              <select
                value={form.eventType}
                onChange={(e) => set('eventType', e.target.value as EventType)}
                className={inputBox}
              >
                <option value="internal">Acara kantor</option>
                <option value="external">Acara luar</option>
              </select>
            </Field>

            <Field label="Kategori">
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as Category)}
                className={inputBox}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Tanggal">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={inputBox}
              />
            </Field>
            <Field label="Mulai">
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className={inputBox}
              />
            </Field>
            <Field label="Selesai">
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className={inputBox}
              />
            </Field>
          </div>

          <Field label="Penyelenggara">
            <input
              value={form.organizerName}
              onChange={(e) => set('organizerName', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Divisi penyelenggara (opsional)">
            <input
              value={form.organizerDepartment ?? ''}
              onChange={(e) => set('organizerDepartment', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Nama tempat">
            <input
              value={form.locationName}
              onChange={(e) => set('locationName', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Alamat">
            <input
              value={form.locationAddress}
              onChange={(e) => set('locationAddress', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Tautan Google Maps">
            <input
              type="url"
              value={form.googleMapsUrl}
              onChange={(e) => set('googleMapsUrl', e.target.value)}
              className={inputLine}
            />
          </Field>

          <Field label="Gambar sampul (URL)">
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => set('coverImageUrl', e.target.value)}
              className={inputLine}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis biaya">
              <select
                value={form.costType}
                onChange={(e) => set('costType', e.target.value as CostType)}
                className={inputBox}
              >
                <option value="free">Gratis</option>
                <option value="registration_fee">Biaya daftar</option>
                <option value="contribution">Iuran</option>
              </select>
            </Field>

            <Field label="Nominal (Rp)">
              <input
                type="number"
                min={0}
                disabled={form.costType === 'free'}
                value={form.costType === 'free' ? 0 : form.cost}
                onChange={(e) => set('cost', Number(e.target.value))}
                className={`${inputBox} disabled:opacity-40`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status pendaftaran">
              <select
                value={form.registrationStatus}
                onChange={(e) => set('registrationStatus', e.target.value as RegistrationStatus)}
                className={inputBox}
              >
                <option value="not_required">Datang saja</option>
                <option value="open">Dibuka</option>
                <option value="closed">Ditutup</option>
              </select>
            </Field>

            <Field label="Kuota (kosongkan kalau bebas)">
              <input
                type="number"
                min={1}
                value={form.maxAttendees ?? ''}
                onChange={(e) =>
                  set('maxAttendees', e.target.value === '' ? undefined : Number(e.target.value))
                }
                className={inputBox}
              />
            </Field>
          </div>

          {form.registrationStatus === 'open' && (
            <Field label="Pendaftaran ditutup pada (opsional)">
              <input
                type="datetime-local"
                value={toLocalInput(form.registrationCloseAt)}
                onChange={(e) => set('registrationCloseAt', e.target.value)}
                className={inputBox}
              />
            </Field>
          )}

          {form.eventType === 'external' && (
            <>
              <Field label="Tautan pendaftaran penyelenggara">
                <input
                  type="url"
                  value={form.externalRegistrationUrl ?? ''}
                  onChange={(e) => set('externalRegistrationUrl', e.target.value)}
                  className={inputLine}
                />
              </Field>
              <Field label="Situs acara">
                <input
                  type="url"
                  value={form.externalEventUrl ?? ''}
                  onChange={(e) => set('externalEventUrl', e.target.value)}
                  className={inputLine}
                />
              </Field>
            </>
          )}

          {error && (
            <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-lime px-6 py-3 font-medium text-ink transition-colors hover:bg-limedim disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : event ? 'Simpan perubahan' : 'Buat acara'}
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  )
}
