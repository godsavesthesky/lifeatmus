import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  fetchAttendanceCounts,
  fetchEvent,
  fetchEvents,
  fetchPublicEvents,
  humanError,
  joinEvent,
  leaveEvent,
} from '@/lib/events'
import type { EventAttendee, EventRecord } from '@/types'

/**
 * Dipakai beranda saat belum login: `attendees` dari `fetchPublicEvents`
 * memang selalu kosong (RLS menolak anon membaca baris peserta), jadi kita
 * isi placeholder sejumlah `confirmed_count` dari fungsi database supaya
 * `confirmedAttendees(event).length` di komponen tetap menunjukkan angka
 * yang benar tanpa satu nama pun ikut terbawa.
 */
function withCountsOnly(events: EventRecord[], counts: Record<string, number>): EventRecord[] {
  return events.map((event) => {
    const n = counts[event.id] ?? 0
    return {
      ...event,
      attendees: Array.from({ length: n }, (_, i) => ({
        id: `count-${event.id}-${i}`,
        eventId: event.id,
        userId: `anon-${i}`,
        status: 'confirmed' as const,
        joinedAt: '',
        // Sengaja tanpa nama asli — cuma dipakai buat `.length`. Jangan
        // dirender lewat AvatarStack untuk pengunjung yang belum login.
        user: { id: `anon-${i}`, name: '', department: 'Unassigned' },
      })),
    }
  })
}

/**
 * Pemuatan acara dari Supabase, plus tombol ikut/batal.
 *
 * Perubahan kehadiran ditulis dulu ke state lokal, baru dikirim ke server —
 * tombol yang baru berubah setelah bolak-balik jaringan terasa rusak. Kalau
 * servernya menolak (kuota penuh, akses dicabut), perubahan lokal
 * dikembalikan dan pesannya ditampilkan.
 */

function isConfirmed(event: EventRecord, userId?: string) {
  if (!userId) return false
  return event.attendees.some((a) => a.userId === userId && a.status === 'confirmed')
}

function withAttendance(event: EventRecord, me: EventAttendee['user'], joined: boolean): EventRecord {
  const existing = event.attendees.find((a) => a.userId === me.id)

  if (existing) {
    return {
      ...event,
      attendees: event.attendees.map((a) =>
        a.userId === me.id ? { ...a, status: joined ? 'confirmed' : 'cancelled' } : a
      ),
    }
  }

  if (!joined) return event

  return {
    ...event,
    attendees: [
      ...event.attendees,
      {
        id: `local-${me.id}-${event.id}`,
        eventId: event.id,
        userId: me.id,
        status: 'confirmed',
        joinedAt: new Date().toISOString(),
        user: me,
      },
    ],
  }
}

export function useEvents() {
  const { profile, session } = useAuth()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (session) {
        setEvents(await fetchEvents())
      } else {
        // Belum login: dua panggilan terpisah, jangan digabung jadi satu
        // query — itu yang menjaga nama peserta tidak pernah ikut kebawa
        // ke browser orang yang belum login.
        const [publicEvents, counts] = await Promise.all([fetchPublicEvents(), fetchAttendanceCounts()])
        setEvents(withCountsOnly(publicEvents, counts))
      }
      setError(null)
    } catch (err) {
      setError(humanError(err))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const joined = useCallback((event: EventRecord) => isConfirmed(event, profile?.id), [profile?.id])

  const toggleJoin = useCallback(
    async (event: EventRecord) => {
      // Bukan cuma UI: kalaupun ini kepanggil lewat cara lain, RLS di
      // `event_attendees` (lihat 0004) tetap menolak insert dari anon.
      // Ini pengaman lapis kedua supaya state lokal tidak berubah dulu
      // sebelum request-nya pasti ditolak server.
      if (!profile || !session) return
      const me = {
        id: profile.id,
        name: profile.name,
        department: profile.department,
        avatarUrl: profile.avatarUrl,
      }
      const next = !isConfirmed(event, profile.id)
      const before = events

      setEvents((prev) => prev.map((e) => (e.id === event.id ? withAttendance(e, me, next) : e)))

      try {
        if (next) await joinEvent(event.id, profile.id)
        else await leaveEvent(event.id, profile.id)
        setError(null)
      } catch (err) {
        setEvents(before)
        setError(humanError(err))
      }
    },
    [events, profile]
  )

  return { events, loading, error, reload: load, joined, toggleJoin }
}

export function useEvent(id: string | undefined) {
  const { profile } = useAuth()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchEvent(id)
      .then((data) => {
        if (!active) return
        setEvent(data)
        setError(null)
      })
      .catch((err) => active && setError(humanError(err)))
      .finally(() => active && setLoading(false))

    // Guard `active`: kalau orang pindah halaman sebelum query selesai,
    // hasilnya tidak boleh menyentuh state komponen yang sudah dilepas.
    return () => {
      active = false
    }
  }, [id])

  const joined = event ? isConfirmed(event, profile?.id) : false

  async function toggleJoin() {
    if (!profile || !event) return
    const me = {
      id: profile.id,
      name: profile.name,
      department: profile.department,
      avatarUrl: profile.avatarUrl,
    }
    const next = !joined
    const before = event

    setEvent(withAttendance(event, me, next))

    try {
      if (next) await joinEvent(event.id, profile.id)
      else await leaveEvent(event.id, profile.id)
      setError(null)
    } catch (err) {
      setEvent(before)
      setError(humanError(err))
    }
  }

  return { event, loading, error, joined, toggleJoin }
}