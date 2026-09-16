-- ============================================================================
-- Weekly Hub — contoh acara (OPSIONAL)
-- ============================================================================
-- Isinya sama dengan data contoh lama di src/data/mockData.ts, supaya
-- aplikasi tidak terasa kosong saat pertama kali disambungkan. Aman
-- dilewati kalau kamu mau langsung mengisi acara sendiri dari halaman Admin.
--
-- Semua baris dikenali lewat judul + tanggal, jadi menjalankan file ini dua
-- kali tidak menghasilkan duplikat. Menghapusnya nanti:
--   delete from public.events where created_by is null;
-- ============================================================================

insert into public.events (
  title, description, cover_image_url, event_type, category,
  date, start_time, end_time,
  organizer_name, organizer_department,
  location_name, location_address, google_maps_url,
  cost, cost_type, registration_status, registration_close_at,
  external_registration_url, external_event_url, max_attendees
)
select * from (values
  (
    'Surabaya Night Run',
    'Lari malam santai keliling kawasan Pakuwon dengan rute 5K dan 10K. Terbuka untuk semua level, ada water station tiap 2K dan medali finisher untuk semua peserta.',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1400&auto=format&fit=crop',
    'external', 'Sports',
    (date_trunc('week', current_date) + interval '5 day')::date, '19:00'::time, '22:00'::time,
    'ABC Events', null,
    'Pakuwon Mall', 'Jl. Puncak Indah Lontar No.2, Surabaya', 'https://maps.google.com/?q=Pakuwon+Mall+Surabaya',
    150000, 'registration_fee', 'open', (date_trunc('week', current_date) + interval '4 day')::timestamptz,
    'https://runsystem.example.com/surabaya-night-run', 'https://abcevents.example.com/surabaya-night-run', 200
  ),
  (
    'Friday Night Dinner',
    'Makan malam bareng seluruh tim sambil ngobrol santai, sekaligus merayakan pencapaian kuartal ini. Menu keluarga, dress code casual.',
    'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1400&auto=format&fit=crop',
    'internal', 'Social',
    (date_trunc('week', current_date) + interval '4 day')::date, '18:30'::time, '21:00'::time,
    'People Team', 'HR (Human Resources)',
    'Kayu Manis Resto', 'Jl. Raya Darmo No.10, Surabaya', 'https://maps.google.com/?q=Jl+Raya+Darmo+Surabaya',
    0, 'free', 'open', null,
    null, null, 40
  ),
  (
    'Weekly Sync: Semua Divisi',
    'Rapat mingguan seluruh divisi. Tiap tim menyampaikan progres, hambatan, dan rencana minggu depan. Maksimal 5 menit per divisi.',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1400&auto=format&fit=crop',
    'internal', 'Meeting',
    date_trunc('week', current_date)::date, '09:00'::time, '10:30'::time,
    'Manajemen', 'Manager Intern',
    'Ruang Rapat Lantai 3', 'Kantor Pusat, Surabaya', 'https://maps.google.com/?q=Surabaya',
    0, 'free', 'not_required', null,
    null, null, null
  ),
  (
    'Workshop: Dasar Motion Graphics',
    'Belajar dasar motion graphics pakai After Effects, dari keyframe sampai easing. Bawa laptop sendiri, software sudah terpasang sebelum acara.',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1400&auto=format&fit=crop',
    'internal', 'Workshop',
    (date_trunc('week', current_date) + interval '2 day')::date, '13:00'::time, '16:00'::time,
    'Tim Kreatif', 'Desain Grafis',
    'Ruang Kreatif', 'Kantor Pusat, Surabaya', 'https://maps.google.com/?q=Surabaya',
    0, 'free', 'open', null,
    null, null, 25
  ),
  (
    'Sharing Session: Cerita dari Klien',
    'Obrolan santai soal proyek klien terakhir — apa yang jalan, apa yang tidak, dan pelajaran yang bisa dipakai tim lain.',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1400&auto=format&fit=crop',
    'internal', 'Sharing',
    (date_trunc('week', current_date) + interval '3 day')::date, '15:30'::time, '17:00'::time,
    'Account Team', 'Marketing Communication (Marcom)',
    'Pantry Lantai 2', 'Kantor Pusat, Surabaya', 'https://maps.google.com/?q=Surabaya',
    0, 'free', 'not_required', null,
    null, null, null
  ),
  (
    'Morning Yoga Session',
    'Mulai hari dengan yoga ringan untuk badan lebih segar. Matras disediakan, cukup datang dan ikuti instruktur.',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1400&auto=format&fit=crop',
    'internal', 'Social',
    (date_trunc('week', current_date) + interval '6 day')::date, '07:00'::time, '08:00'::time,
    'Wellness Committee', 'HR (Human Resources)',
    'Rooftop Kantor', 'Kantor Pusat, Surabaya', 'https://maps.google.com/?q=Surabaya',
    0, 'free', 'open', null,
    null, null, 20
  )
) as seed(
  title, description, cover_image_url, event_type, category,
  date, start_time, end_time,
  organizer_name, organizer_department,
  location_name, location_address, google_maps_url,
  cost, cost_type, registration_status, registration_close_at,
  external_registration_url, external_event_url, max_attendees
)
where not exists (
  select 1 from public.events e where e.title = seed.title and e.date = seed.date
);

insert into public.weekly_playlists (
  week_start, week_label, title, curator_name, cover_image_url,
  apple_music_embed_url, apple_music_url
)
values (
  date_trunc('week', current_date)::date,
  upper(to_char(date_trunc('week', current_date), 'DD Mon YYYY')),
  'Office Mood: Friday Energy',
  'Pilihan tim People',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
  -- Ganti dengan playlist kantor sendiri: ubah tautan music.apple.com/...
  -- menjadi embed.music.apple.com/... untuk mendapatkan URL embed.
  'https://embed.music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb',
  'https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb'
)
on conflict (week_start) do nothing;
