import { Navigate } from 'react-router-dom'

/**
 * Dulu halaman ini form daftar manual (nama/email/password). Sekarang login
 * cuma lewat Google, dan Google login SEKALIGUS jadi cara daftar (lihat
 * signInWithGoogle di lib/auth.tsx), jadi tidak ada lagi formulir terpisah.
 * Rute /daftar dipertahankan supaya tautan lama tidak 404, cuma dialihkan.
 */
export function Signup() {
  return <Navigate to="/login" replace />
}