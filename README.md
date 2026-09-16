# Weekly Hub

Platform acara & agenda mingguan internal kantor. React + TypeScript + Vite +
Tailwind, backend Supabase (Postgres + Auth). Bahasa UI: Indonesia.

Status: **backend sudah tersambung**. Tidak ada lagi data contoh di kode —
semua acara, peserta, anggota, dan playlist dibaca dari Supabase.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173

Butuh `.env` berisi:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Kalau kosong, aplikasi menampilkan layar instruksi setup, bukan layar putih.

## Migrasi database

Jalankan berurutan di Supabase SQL Editor:

| Berkas | Isi |
| --- | --- |
| `0001_init.sql` | `departments`, `profiles`, trigger anti-promosi-diri-sendiri |
| `0002_audit_log.sql` | catatan perubahan hak istimewa |
| `0003_open_signup_and_access_control.sql` | pendaftaran terbuka, `is_active`, `is_admin()` / `is_active()`, penjaga admin terakhir |
| `0004_events.sql` | `events`, `event_attendees`, `weekly_playlists` + RLS + penjaga kuota |
| `0005_seed_events.sql` | **opsional** — contoh acara & playlist supaya tidak kosong |

Semuanya aman dijalankan ulang.

Admin pertama harus diangkat manual (belum ada admin yang bisa mengangkat):

```sql
update public.profiles set is_admin = true where email = 'kamu@email.com';
```

## Struktur

```
src/
  components/   UI dipakai ulang (EventCard, EventIndex, JoinButton, EventForm, ...)
  pages/        Home, WeeklyAgenda, Events, EventDetail, Admin, Login, Signup
  hooks/        useEvents — memuat acara + tombol ikut/batal
  lib/          supabase.ts, auth.tsx, events.ts (semua query), format.ts
  data/         departments.ts — daftar divisi (cermin tabel departments)
  types/        tipe bersama, cerminan skema database
supabase/migrations/
```

Satu-satunya tempat yang tahu nama kolom database adalah `src/lib/events.ts`.
Kalau skema berubah, yang perlu disentuh cuma berkas itu.

## Model akses

- Pendaftaran terbuka untuk email apa pun. Akun baru selalu masuk dengan
  `department_verified = false` dan muncul di halaman Admin sebagai pendaftar
  baru yang harus diperiksa.
- `profiles.is_active` — admin bisa mencabut akses siapa pun. Saat `false`,
  RLS membuat orang itu tidak bisa membaca data apa pun (bukan sekadar tombol
  yang disembunyikan). Sesi yang sedang berjalan tidak langsung putus: access
  token Supabase hidup ±1 jam, tapi selama itu semua query balik kosong.
- Hanya admin yang boleh membuat/mengubah/menghapus acara.
- Setiap orang hanya bisa mendaftarkan dirinya sendiri ke acara — ditegakkan
  kebijakan RLS `user_id = auth.uid()`, bukan oleh tombol di UI.
- Kuota acara ditegakkan trigger database, jadi dua orang yang menekan "Ikut"
  bersamaan tetap tidak bisa melebihi kuota.

## Deploy

Push ke GitHub, impor di Vercel/Netlify, isi `VITE_SUPABASE_URL` dan
`VITE_SUPABASE_ANON_KEY` di dashboard hosting, deploy. Anon key memang aman
berada di browser — semua izin dijaga RLS di Postgres.
