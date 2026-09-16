import { supabase } from '@/lib/supabase'
import type { EventAttendee, EventRecord, User, WeeklyPlaylist } from '@/types'

/**
 * Satu-satunya tempat yang tahu bentuk baris database.
 *
 * Semua halaman tetap bekerja dengan tipe `EventRecord` yang sama seperti
 * waktu masih pakai data contoh — jadi kalau nanti nama kolom di Postgres
 * berubah, yang perlu disentuh cuma file ini, bukan lima halaman sekaligus.
 */

/** Postgres mengembalikan `time` sebagai "19:00:00"; UI hanya butuh "19:00". */
function hhmm(value: string | null): string {
  return (value ?? '').slice(0, 5)
}

/** Kolom yang diminta untuk satu acara, lengkap dengan pesertanya. */
const EVENT_SELECT = `
  id, title, description, cover_image_url, event_type, category,
  date, start_time, end_time,
  organizer_name, organizer_department,
  location_name, location_address, google_maps_url,
  cost, cost_type,
  registration_status, registration_open_at, registration_close_at,
  external_registration_url, external_event_url,
  max_attendees, created_by,
  attendees:event_attendees (
    id, event_id, user_id, status, joined_at,
    user:profiles ( id, name, department, avatar_url )
  )
`

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAttendee(row: any): EventAttendee {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    joinedAt: row.joined_at,
    // Profil bisa null kalau akunnya sudah dihapus tapi barisnya belum ikut
    // terhapus (misal data lama sebelum foreign key dipasang). Jangan biarkan
    // itu membuat seluruh halaman gagal dirender.
    user: {
      id: row.user?.id ?? row.user_id,
      name: row.user?.name ?? 'Anggota',
      department: row.user?.department ?? 'Unassigned',
      avatarUrl: row.user?.avatar_url ?? undefined,
    },
  }
}

function mapEvent(row: any): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    coverImageUrl: row.cover_image_url ?? '',
    eventType: row.event_type,
    category: row.category,
    date: row.date,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    organizerName: row.organizer_name ?? '',
    organizerDepartment: row.organizer_department ?? undefined,
    locationName: row.location_name ?? '',
    locationAddress: row.location_address ?? '',
    googleMapsUrl: row.google_maps_url ?? '',
    cost: row.cost ?? 0,
    costType: row.cost_type,
    registrationStatus: row.registration_status,
    registrationOpenAt: row.registration_open_at ?? undefined,
    registrationCloseAt: row.registration_close_at ?? undefined,
    externalRegistrationUrl: row.external_registration_url ?? undefined,
    externalEventUrl: row.external_event_url ?? undefined,
    maxAttendees: row.max_attendees ?? undefined,
    createdBy: row.created_by ?? '',
    attendees: (row.attendees ?? []).map(mapAttendee),
  }
}

export function mapProfile(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    department: row.department,
    departmentVerified: row.department_verified,
    role: row.role,
    isAdmin: row.is_admin,
    // Kolom ini baru ada sejak migrasi 0003. `!== false` supaya baris lama
    // yang belum punya kolomnya tetap dianggap aktif, bukan tercabut.
    isActive: row.is_active !== false,
    accessRevokedAt: row.access_revoked_at ?? undefined,
    accessRevokedReason: row.access_revoked_reason ?? undefined,
    createdAt: row.created_at,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Bentuk yang dipakai form acara di halaman Admin. */
export type EventInput = Omit<EventRecord, 'id' | 'attendees' | 'createdBy'>

function toRow(input: EventInput) {
  // String kosong dari <input> dikirim sebagai null, bukan "". Kolom URL
  // dan tanggal opsional harus benar-benar kosong supaya pengecekan
  // `if (event.externalEventUrl)` di UI tidak lolos untuk string kosong.
  const orNull = (v?: string) => (v && v.trim() !== '' ? v : null)

  return {
    title: input.title.trim(),
    description: input.description ?? '',
    cover_image_url: input.coverImageUrl ?? '',
    event_type: input.eventType,
    category: input.category,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    organizer_name: input.organizerName ?? '',
    organizer_department: orNull(input.organizerDepartment),
    location_name: input.locationName ?? '',
    location_address: input.locationAddress ?? '',
    google_maps_url: input.googleMapsUrl ?? '',
    cost: input.costType === 'free' ? 0 : Number(input.cost) || 0,
    cost_type: input.costType,
    registration_status: input.registrationStatus,
    registration_open_at: orNull(input.registrationOpenAt),
    registration_close_at: orNull(input.registrationCloseAt),
    external_registration_url: orNull(input.externalRegistrationUrl),
    external_event_url: orNull(input.externalEventUrl),
    max_attendees: input.maxAttendees ? Number(input.maxAttendees) : null,
  }
}

// ── Baca ────────────────────────────────────────────────────────────────────

export async function fetchEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapEvent)
}

/** Acara pada rentang tanggal tertentu (dipakai halaman Agenda). */
export async function fetchEventsBetween(fromIso: string, toIso: string): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .gte('date', fromIso)
    .lte('date', toIso)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapEvent)
}

export async function fetchEvent(id: string): Promise<EventRecord | null> {
  const { data, error } = await supabase.from('events').select(EVENT_SELECT).eq('id', id).maybeSingle()

  if (error) throw error
  return data ? mapEvent(data) : null
}

/**
 * Versi publik: dipakai beranda saat belum login. Query-nya sama seperti
 * `fetchEvents`, tapi anon memang tidak diizinkan RLS membaca
 * `event_attendees`/`profiles`, jadi `attendees` di hasilnya selalu kosong.
 * Jumlah orang yang ikut didapat terpisah lewat `fetchAttendanceCounts`,
 * yang cuma mengembalikan angka lewat fungsi database, bukan nama.
 */
export async function fetchPublicEvents(): Promise<EventRecord[]> {
  return fetchEvents()
}

/** Peta event_id -> jumlah orang yang confirmed. Aman dipanggil tanpa login. */
export async function fetchAttendanceCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('event_attendance_counts')
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.event_id] = Number(row.confirmed_count)
  }
  return counts
}

export async function fetchPlaylist(): Promise<WeeklyPlaylist | null> {
  // Playlist minggu berjalan, atau yang paling baru kalau minggu ini belum
  // diisi — lebih baik menampilkan playlist minggu lalu daripada kosong.
  const { data, error } = await supabase
    .from('weekly_playlists')
    .select('*')
    .lte('week_start', new Date().toISOString().slice(0, 10))
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    weekLabel: data.week_label ?? '',
    title: data.title,
    curatorName: data.curator_name ?? '',
    coverImageUrl: data.cover_image_url ?? '',
    appleMusicEmbedUrl: data.apple_music_embed_url ?? '',
    appleMusicUrl: data.apple_music_url ?? '',
  }
}

// ── Kehadiran ───────────────────────────────────────────────────────────────

/**
 * Menandai ikut. Memakai upsert pada (event_id, user_id) karena orang yang
 * pernah batal masih punya baris dengan status 'cancelled' — insert biasa
 * akan tertolak unique constraint, dan pesannya tidak berarti apa-apa
 * untuk orang yang cuma menekan tombol.
 */
export async function joinEvent(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_attendees')
    .upsert(
      { event_id: eventId, user_id: userId, status: 'confirmed', joined_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' }
    )

  if (error) throw error
}

/** Batal ikut: barisnya tetap ada, statusnya yang berubah. */
export async function leaveEvent(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_attendees')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Kelola acara (admin) ────────────────────────────────────────────────────

export async function createEvent(input: EventInput, createdBy: string) {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...toRow(input), created_by: createdBy })
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function updateEvent(id: string, input: EventInput) {
  const { data, error } = await supabase
    .from('events')
    .update(toRow(input))
    .eq('id', id)
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// ── Anggota (admin) ─────────────────────────────────────────────────────────

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapProfile)
}

/** Field yang boleh diubah admin, dipetakan ke nama kolomnya. */
export async function updateProfile(id: string, changes: Partial<User>) {
  const row: Record<string, unknown> = {}

  if (changes.name !== undefined) row.name = changes.name
  if (changes.department !== undefined) row.department = changes.department
  if (changes.role !== undefined) row.role = changes.role
  if (changes.departmentVerified !== undefined) row.department_verified = changes.departmentVerified
  if (changes.isAdmin !== undefined) row.is_admin = changes.isAdmin
  if (changes.isActive !== undefined) {
    row.is_active = changes.isActive
    row.access_revoked_at = changes.isActive ? null : new Date().toISOString()
    if (changes.isActive) row.access_revoked_reason = null
  }
  if (changes.accessRevokedReason !== undefined) row.access_revoked_reason = changes.accessRevokedReason

  const { data, error } = await supabase.from('profiles').update(row).eq('id', id).select('*').single()

  if (error) throw error
  return mapProfile(data)
}

/**
 * Pesan error Postgres berbahasa Inggris dan menyebut nama constraint.
 * Yang sering muncul diterjemahkan; sisanya ditampilkan apa adanya daripada
 * disembunyikan di balik "terjadi kesalahan" yang tidak menolong siapa pun.
 */
export function humanError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()

  if (lower.includes('kuota acara')) return message
  if (lower.includes('admin aktif terakhir')) return message
  if (lower.includes('row-level security') || lower.includes('violates row-level'))
    return 'Aksi ini tidak diizinkan untuk akunmu. Kalau merasa seharusnya bisa, minta admin memeriksa aksesmu.'
  if (lower.includes('duplicate key')) return 'Data ini sudah ada sebelumnya.'
  if (lower.includes('failed to fetch') || lower.includes('networkerror'))
    return 'Tidak bisa menghubungi server. Cek koneksi internet lalu coba lagi.'

  return message
}