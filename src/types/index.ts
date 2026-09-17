import type { Department } from '@/data/departments'

export type Role = 'employee' | 'intern'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  department: Department | 'Unassigned'
  /** Salah sampai admin memastikan divisi yang dipilih sendiri saat daftar itu benar. */
  departmentVerified: boolean
  /** Sudah pernah lewatin layar "lengkapi profil" sekali jalan atau belum. */
  onboarded: boolean
  role: Role
  /**
   * Admin adalah *hak akses*, bukan jabatan — karyawan maupun magang sama-sama
   * bisa ditandai admin. Nilai ini hanya menentukan apa yang ditampilkan UI;
   * jangan pernah dianggap sebagai batas keamanan (lihat penjaga rute /admin
   * dan kebijakan RLS, yang merupakan gerbang sebenarnya).
   */
  isAdmin: boolean
  /**
   * Akses bisa dicabut admin kapan saja. Saat false, kebijakan RLS membuat
   * orang ini tidak bisa membaca apa pun dari database — bukan sekadar
   * tombolnya disembunyikan. Opsional supaya data lama tanpa kolom ini
   * tetap terbaca sebagai aktif.
   */
  isActive?: boolean
  accessRevokedAt?: string
  accessRevokedReason?: string
  createdAt: string
}

export type EventType = 'external' | 'internal'

export type Category =
  | 'Meeting'
  | 'Workshop'
  | 'Sharing'
  | 'Sports'
  | 'Social'
  | 'Event'
  | 'Other'

export type RegistrationStatus = 'open' | 'closed' | 'not_required'

export type CostType = 'free' | 'registration_fee' | 'contribution'

export interface EventAttendee {
  id: string
  eventId: string
  userId: string
  status: 'confirmed' | 'cancelled'
  joinedAt: string
  user: Pick<User, 'id' | 'name' | 'department' | 'avatarUrl'>
}

export interface WeeklyPlaylist {
  id: string
  weekLabel: string
  title: string
  curatorName: string
  coverImageUrl: string
  appleMusicEmbedUrl: string
  appleMusicUrl: string
}

export interface EventRecord {
  id: string
  title: string
  description: string
  coverImageUrl: string
  eventType: EventType
  category: Category

  date: string // ISO, contoh 2026-09-17
  startTime: string // HH:mm
  endTime: string // HH:mm

  organizerName: string
  organizerDepartment?: string

  locationName: string
  locationAddress: string
  googleMapsUrl: string

  cost: number
  costType: CostType

  registrationStatus: RegistrationStatus
  registrationOpenAt?: string
  registrationCloseAt?: string

  externalRegistrationUrl?: string
  externalEventUrl?: string

  maxAttendees?: number

  createdBy: string
  attendees: EventAttendee[]
}