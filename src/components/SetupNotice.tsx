/**
 * Ditampilkan menggantikan seluruh aplikasi ketika .env belum diisi.
 * Tujuannya satu: mengganti layar putih kosong dengan sesuatu yang
 * memberi tahu persis apa yang harus dilakukan.
 */
export function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-ink">
      <div className="max-w-lg w-full border border-line p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-lime mb-3">Setup belum selesai</p>

        <h1 className="font-display text-3xl uppercase text-cream mb-5">
          Koneksi Supabase belum diatur
        </h1>

        <p className="text-sm text-muted leading-relaxed mb-6">
          Aplikasi butuh kredensial project Supabase sebelum bisa jalan. Jalankan ini di folder
          project, isi nilainya, lalu restart dev server.
        </p>

        <pre className="bg-navy/40 border border-line px-4 py-3 text-xs text-cream/90 overflow-x-auto mb-6">
          <code>{`cp .env.example .env
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev`}</code>
        </pre>

        <p className="text-xs text-muted leading-relaxed">
          Kedua nilai itu ada di dashboard Supabase: <span className="text-cream/80">Project
          Settings → API</span>. Ingat, Vite hanya membaca .env saat server start — kalau file-nya
          baru diisi, dev server-nya harus dimatikan dan dijalankan ulang.
        </p>
      </div>
    </div>
  )
}