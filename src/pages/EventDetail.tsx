import { Link, useParams } from 'react-router-dom'
import { StatusBadge, TypeBadge, CategoryChip } from '@/components/Badge'
import { AvatarStack } from '@/components/AvatarStack'
import { JoinButton, RegisterButton } from '@/components/JoinButton'
import { WhoIsIn } from '@/components/WhoIsIn'
import { ErrorNote, Loading } from '@/components/States'
import { useEvent } from '@/hooks/useEvents'
import { costLabel, confirmedAttendees, effectiveStatus, formatDateLong, timeRange } from '@/lib/format'

export function EventDetail() {
  const { id } = useParams()
  const { event, loading, error, joined, toggleJoin } = useEvent(id)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <Loading label="Membuka acara…" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-32 text-center">
        <h1 className="font-display text-huge uppercase text-cream">Acara tidak ada</h1>
        <p className="mt-3 text-sm text-muted">Mungkin sudah dihapus, atau tautannya salah ketik.</p>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <Link to="/events" className="link-sweep mt-6 inline-block text-lime">
          Lihat semua acara
        </Link>
      </div>
    )
  }

  const status = effectiveStatus(event)
  const attendees = confirmedAttendees(event)
  const full = !!event.maxAttendees && attendees.length >= event.maxAttendees

  return (
    <article>
      {/* Gambar sampul dengan judul yang menggantung melewati tepi bawahnya.
          Bagian ini yang membuat halaman terasa seperti halaman majalah,
          bukan kartu detail. */}
      <header className="mx-auto max-w-[1400px] px-5 pt-10 md:px-10">
        <div className="grain relative aspect-[16/9] max-h-[60vh] overflow-hidden">
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="relative z-10 -mt-10 md:-mt-16">
          <h1 className="font-display text-huge uppercase text-cream">{event.title}</h1>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <TypeBadge type={event.eventType} />
          <CategoryChip category={event.category} />
          <StatusBadge status={status} />
        </div>
      </header>

      <div className="mx-auto mt-12 grid max-w-[1400px] gap-12 px-5 pb-12 md:grid-cols-12 md:px-10">
        <div className="flex flex-col gap-12 md:col-span-7">
          <dl className="tnum grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 text-sm sm:grid-cols-3">
            <Field label="Tanggal">{formatDateLong(event.date)}</Field>
            <Field label="Waktu">{timeRange(event)}</Field>
            <Field label="Penyelenggara">
              {event.organizerName}
              {event.organizerDepartment && (
                <span className="block text-muted">{event.organizerDepartment}</span>
              )}
            </Field>
          </dl>

          <section>
            <h2 className="font-display text-loud uppercase text-cream">Tentang acara ini</h2>
            {/* Panjang baris dibatasi supaya mata tidak kehilangan barisnya
                saat kembali ke kiri. */}
            <p className="mt-3 max-w-[62ch] whitespace-pre-line leading-relaxed text-cream/85">
              {event.description}
            </p>
          </section>

          <section>
            <h2 className="font-display text-loud uppercase text-cream">Lokasi</h2>
            <p className="mt-3 text-cream/85">{event.locationName}</p>
            <p className="text-sm text-muted">{event.locationAddress}</p>
            {event.googleMapsUrl && (
              <a
                href={event.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep mt-3 inline-block text-sm text-lime"
              >
                Buka di Google Maps
              </a>
            )}
          </section>

          {event.externalEventUrl && (
            <section>
              <h2 className="font-display text-loud uppercase text-cream">Situs acara</h2>
              <a
                href={event.externalEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep mt-3 inline-block break-all text-sm text-lime"
              >
                {event.externalEventUrl.replace(/^https?:\/\//, '')}
              </a>
            </section>
          )}

          <WhoIsIn attendees={event.attendees} />
        </div>

        {/* Panel tindakan. Menempel saat digulir di layar besar, karena
            keputusan "ikut atau tidak" bisa muncul kapan saja saat membaca. */}
        <aside className="h-fit border border-line p-6 md:sticky md:top-28 md:col-span-4 md:col-start-9">
          <p className="text-sm text-muted">Biaya</p>
          <p className="font-display mt-1 text-loud uppercase text-cream">{costLabel(event)}</p>

          <div className="mt-6 border-t border-line pt-6">
            <div className="flex items-center gap-3">
              <AvatarStack attendees={attendees} max={4} size="md" />
              <p className="text-sm text-cream">
                {attendees.length} ikut
                {event.maxAttendees && (
                  <span className="tnum block text-muted">dari {event.maxAttendees} kuota</span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 border-t border-line pt-6">
            <JoinButton joined={joined} full={full} onToggle={toggleJoin} />
            {event.eventType === 'external' &&
              (status === 'open' && event.externalRegistrationUrl ? (
                <RegisterButton url={event.externalRegistrationUrl} />
              ) : status === 'closed' ? (
                <p className="text-sm text-muted">Pendaftaran sudah ditutup penyelenggara.</p>
              ) : null)}

            {/* Error kehadiran muncul di sebelah tombolnya, bukan di atas
                halaman — di situlah mata orangnya sedang berada. */}
            {error && <ErrorNote message={error} />}
          </div>
        </aside>
      </div>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-muted">{label}</dt>
      <dd className="text-cream">{children}</dd>
    </div>
  )
}
