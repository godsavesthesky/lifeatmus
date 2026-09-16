# Yang dikerjakan di tahap ini

Semua poin "belum dikerjakan" dari ringkasan status sebelumnya sudah selesai.
Folder ini adalah project lengkap — tinggal timpa folder `Weekly Hub` lama
(kecuali `node_modules` dan `.env` milikmu, yang tidak ikut disertakan).

## 1. Database

**Baru: `supabase/migrations/0004_events.sql`**
- Tabel `events`, `event_attendees`, `weekly_playlists`, lengkap dengan RLS.
- Baca: semua orang yang aktif. Tulis acara: hanya admin. Kehadiran: hanya
  untuk diri sendiri (`user_id = auth.uid()`).
- Trigger `enforce_event_capacity()` — kuota ditegakkan di database, bukan
  hanya dengan menyembunyikan tombol.
- Indeks pada `events(date, start_time)` karena hampir semua query mengurut
  atau menyaring per tanggal.

**Baru: `supabase/migrations/0005_seed_events.sql` (opsional)**
- Enam contoh acara + satu playlist, tanggalnya relatif ke minggu berjalan
  (`date_trunc('week', current_date)`) jadi selalu terlihat "minggu ini".
- Boleh dilewati kalau mau langsung isi acara sendiri lewat halaman Admin.
- Menghapusnya nanti: `delete from public.events where created_by is null;`

**Dipulihkan: `0003_open_signup_and_access_control.sql`**
Berkas ini kosong (0 byte) di zip yang kamu kirim — isinya hilang, padahal
SQL-nya sudah pernah kamu jalankan di Supabase. Sudah ditulis ulang dan
dibuat idempotent, jadi aman dijalankan lagi untuk menyamakan repo dengan
keadaan database.

### Urutan menjalankan

Kalau 0001–0003 sudah pernah jalan, cukup:

```
0004_events.sql
0005_seed_events.sql   (opsional)
```

## 2. Data contoh dihapus

`src/data/mockData.ts` **dihapus**. Semua halaman sekarang query Supabase:

| Halaman | Sumber data |
| --- | --- |
| Home | `fetchEvents()` + `fetchPlaylist()` |
| Events | `fetchEvents()`, disaring di klien |
| EventDetail | `fetchEvent(id)` |
| WeeklyAgenda | `fetchEvents()`, dikelompokkan per tanggal |
| Admin | `fetchProfiles()` + `fetchEvents()` |

Semua query ada di **`src/lib/events.ts`** — satu-satunya berkas yang tahu
nama kolom database. Halaman tetap bekerja dengan tipe `EventRecord` yang
sama seperti waktu masih pakai mock.

`src/hooks/useEvents.ts` membungkus pemuatan + tombol ikut/batal. Perubahan
kehadiran ditulis ke layar dulu, baru dikirim ke server; kalau ditolak
(kuota penuh, akses dicabut), dikembalikan dan pesannya muncul.

## 3. Halaman daftar (signup)

`src/pages/Signup.tsx`, rute **`/daftar`**, tertaut dari halaman Login.

Nama/divisi/status dikirim sebagai `raw_user_meta_data` dan dibaca trigger
`handle_new_user` — trigger itu memvalidasi ulang divisi dan role, jadi apa
pun yang dikirim dari formulir tidak dipercaya begitu saja. Kalau konfirmasi
email menyala di Supabase, halamannya bilang "cek emailmu" alih-alih diam
saja lalu gagal saat login.

## 4. Halaman Admin benar-benar menulis

- Setujui divisi, ubah divisi/status/nama, beri hak admin, cabut & pulihkan
  akses — semuanya `update` ke `profiles`.
- Bagian **Acara** baru: tambah, ubah, hapus acara lewat panel geser
  (`src/components/EventForm.tsx`).
- Mengubah diri sendiri (misal melepas hak admin) langsung menyegarkan
  profil di context, jadi navbar dan penjaga rute ikut berubah.

## 5. Bug yang ikut dibereskan

- **`Setupnotice.tsx` → `SetupNotice.tsx`.** `App.tsx` meng-import
  `@/components/SetupNotice`. Di Windows/macOS ini jalan karena nama berkas
  tidak peka huruf besar-kecil; di Linux (Vercel, Netlify, Docker) build-nya
  gagal. Ini akan menggigit tepat saat deploy.
- **`tsconfig.json`**: `baseUrl` sudah usang di TypeScript 6 dan membuat
  `npm run build` berhenti dengan TS5101. Dihapus; `paths` diubah jadi
  `"@/*": ["./src/*"]`.
- **`JoinButton`** menyimpan status ikut di state-nya sendiri, jadi setelah
  halaman dimuat ulang selalu kembali ke "Ikut" walaupun orangnya sudah
  terdaftar. Sekarang statusnya datang dari data.
- **`auth.tsx`** tidak pernah membaca `is_active`, jadi orang yang aksesnya
  dicabut cuma melihat aplikasi kosong tanpa penjelasan. Sekarang ada pita
  peringatan di atas halaman.
- **Rute publik.** Home/agenda/events sebelumnya bisa dibuka tanpa login,
  padahal RLS tidak memberi apa pun ke pengunjung anonim — yang muncul
  halaman kosong. Sekarang semuanya di balik `ProtectedRoute`.
- **`Squiggle.tsx`** dihapus (tidak dipakai di mana pun sejak redesign).
- **`.eslintrc.cjs`** ditambahkan; `npm run lint` tadinya selalu gagal karena
  tidak ada berkas konfigurasi.

## 6. Sudah dites

- `npx tsc -b` → bersih, tanpa error.
- `npm run lint` → 0 error (1 peringatan lama di `auth.tsx` soal fast-refresh,
  karena berkas itu mengekspor `AuthProvider` dan `useAuth` sekaligus; ini
  memang disengaja).
- `npm run build` tidak bisa dijalankan di sini karena `node_modules` dari
  zip berisi binary Rollup untuk Windows. Jalankan sendiri setelah
  `npm install` di mesinmu.

## Langkah berikutnya untukmu

1. Timpa folder project lama dengan isi folder ini (`.env` milikmu tetap).
2. `npm install` lalu `npm run dev`.
3. Jalankan `0004` (dan `0005` kalau mau contoh data) di Supabase SQL Editor.
4. Daftar lewat `/daftar`, lalu angkat diri sendiri jadi admin:
   `update public.profiles set is_admin = true where email = '...';`
5. Muat ulang halaman → menu Admin muncul → coba tambah acara, lalu tekan
   "Ikut" di beranda untuk mengetes kehadiran.

## Yang sengaja belum dikerjakan

- **Lupa kata sandi.** Supabase menyediakan `resetPasswordForEmail`, tapi
  perlu halaman khusus untuk menerima tautannya. Belum ada.
- **Unggah foto profil & gambar sampul.** Saat ini sampul acara diisi sebagai
  URL. Untuk unggahan asli perlu Supabase Storage + kebijakan bucket-nya.
- **Realtime.** Daftar peserta baru ikut berubah setelah halaman dimuat
  ulang. Supabase Realtime bisa membuatnya langsung, kalau memang terasa
  perlu.
- **Playlist belum bisa diatur dari UI** — untuk ganti playlist minggu ini,
  isi tabel `weekly_playlists` lewat Supabase (satu baris per `week_start`).
