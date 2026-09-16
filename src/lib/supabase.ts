import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Versi lama melempar Error di sini, di level module. Karena file ini
 * di-import oleh auth.tsx, yang di-import oleh App.tsx, yang di-import oleh
 * main.tsx, error itu terjadi SEBELUM React sempat me-render apa pun —
 * hasilnya layar putih kosong tanpa petunjuk apa-apa di halaman.
 *
 * Sekarang: jangan melempar. Ekspor flag-nya, biarkan App menampilkan
 * layar setup yang menjelaskan apa yang kurang.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Weekly Hub] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
      'Salin .env.example menjadi .env lalu isi nilainya, dan restart `npm run dev`.'
  )
}

/**
 * Anon key memang aman dikirim ke browser — dia menandai project, bukan
 * user yang punya privilege. Semua pemeriksaan izin yang sebenarnya terjadi
 * di Postgres lewat Row Level Security (lihat supabase/migrations/).
 *
 * Placeholder URL di bawah hanya dipakai saat env belum diisi, supaya
 * createClient tidak crash. Request apa pun ke sana akan gagal, tapi UI
 * sudah lebih dulu menampilkan layar setup jadi tidak akan sampai ke situ.
 */
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'placeholder-anon-key'
)