import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { mapProfile } from '@/lib/events'
import type { User } from '@/types'

interface AuthState {
  /** Objek sesi milik Supabase (token, kedaluwarsa). Null saat belum masuk. */
  session: Session | null
  /**
   * Baris `profiles` milik orang yang sedang masuk — nama, divisi, role,
   * isAdmin, dan status aksesnya. Inilah yang dibaca seluruh aplikasi.
   *
   * `isAdmin` di sini HANYA untuk tampilan. Izin sebenarnya ditegakkan
   * database lewat Row Level Security; flag ini cuma menentukan apa yang
   * ditampilkan. Jangan pernah menjadikannya satu-satunya penjaga.
   */
  profile: User | null
  loading: boolean
  /** Profil ada tapi aksesnya dicabut admin — datanya akan kosong semua. */
  accessRevoked: boolean
  /**
   * Login lewat Google OAuth. Ini juga BERFUNGSI SEBAGAI daftar: kalau
   * `auth.users` belum ada baris untuk akun Google ini, Supabase membuatnya
   * sendiri, lalu trigger `handle_new_user` (lihat migrasi 0001/0003) yang
   * mengisi baris `profiles`-nya — sama seperti alur email/password lama,
   * cuma pemicunya beda. Tidak ada langkah "daftar" terpisah.
   */
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) void loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) void loadProfile(newSession.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    setLoading(true)
    // RLS mengizinkan siapa pun membaca BARISNYA SENDIRI, termasuk orang yang
    // aksesnya dicabut (lihat migrasi 0003) — justru itu yang membuat kita
    // bisa menampilkan penjelasan, bukan layar kosong.
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

    if (error) {
      console.error('Gagal memuat profil', error)
      setProfile(null)
    } else if (!data) {
      // Baris profil belum terbentuk. Biasanya berarti trigger
      // handle_new_user belum terpasang di project Supabase-nya.
      console.warn('Akun ini belum punya baris di tabel profiles.')
      setProfile(null)
    } else {
      setProfile(mapProfile(data))
    }
    setLoading(false)
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id)
  }

  async function signInWithGoogle() {
    // redirectTo: balik ke origin saat ini (bukan hardcode localhost), jadi
    // ini otomatis benar baik di localhost maupun di domain production.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const accessRevoked = Boolean(profile && profile.isActive === false)

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, accessRevoked, signInWithGoogle, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}