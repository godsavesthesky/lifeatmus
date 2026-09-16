-- ============================================================================
-- Weekly Hub — acara, peserta, dan playlist mingguan
-- ============================================================================
-- Jalankan SETELAH 0001, 0002, dan 0003. Migrasi ini memakai fungsi
-- public.is_admin() dan public.is_active() yang dibuat di 0003.
--
-- Aman dijalankan ulang.
-- ============================================================================

-- 1. events ------------------------------------------------------------------
-- Skemanya adalah cerminan langsung dari tipe `EventRecord` di
-- src/types/index.ts, dengan nama kolom snake_case. Pemetaannya ada satu
-- tempat saja di frontend: src/lib/events.ts.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text not null default '',
  cover_image_url text not null default '',

  event_type text not null default 'internal' check (event_type in ('external', 'internal')),
  category text not null default 'Other'
    check (category in ('Meeting', 'Workshop', 'Sharing', 'Sports', 'Social', 'Event', 'Other')),

  date date not null,
  start_time time not null,
  end_time time not null,

  organizer_name text not null default '',
  organizer_department text,

  location_name text not null default '',
  location_address text not null default '',
  google_maps_url text not null default '',

  -- Rupiah tidak punya sen, jadi integer sudah cukup dan menghindari
  -- pembulatan aneh yang dibawa tipe float.
  cost integer not null default 0 check (cost >= 0),
  cost_type text not null default 'free' check (cost_type in ('free', 'registration_fee', 'contribution')),

  registration_status text not null default 'not_required'
    check (registration_status in ('open', 'closed', 'not_required')),
  registration_open_at timestamptz,
  registration_close_at timestamptz,

  external_registration_url text,
  external_event_url text,

  max_attendees integer check (max_attendees is null or max_attendees > 0),

  -- on delete set null, bukan cascade: menghapus akun orang yang pernah
  -- membuat acara tidak boleh ikut menghapus acaranya.
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_time_order check (end_time > start_time)
);

-- Hampir semua query di aplikasi mengurutkan atau memfilter per tanggal
-- (beranda, agenda mingguan, jelajah).
create index if not exists events_date_idx on public.events (date, start_time);

alter table public.events enable row level security;

drop policy if exists "events readable by active users" on public.events;
create policy "events readable by active users"
  on public.events for select
  to authenticated
  using (public.is_active());

-- Hanya admin yang boleh membuat/mengubah/menghapus acara. Kalau nanti mau
-- membuka ini untuk semua karyawan, ganti `public.is_admin()` di tiga
-- kebijakan berikut dengan `public.is_active()` dan tambahkan
-- `created_by = auth.uid()` pada update/delete.
drop policy if exists "admins insert events" on public.events;
create policy "admins insert events"
  on public.events for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update events" on public.events;
create policy "admins update events"
  on public.events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete events" on public.events;
create policy "admins delete events"
  on public.events for delete
  to authenticated
  using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_events_touch on public.events;
create trigger trg_events_touch
  before update on public.events
  for each row
  execute function public.touch_updated_at();

-- 2. event_attendees ---------------------------------------------------------
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  joined_at timestamptz not null default now(),

  -- Satu baris per orang per acara. Batal ikut mengubah status jadi
  -- 'cancelled', bukan menghapus barisnya — supaya riwayat "pernah ikut
  -- lalu batal" tidak hilang begitu saja.
  unique (event_id, user_id)
);

create index if not exists event_attendees_event_idx on public.event_attendees (event_id);
create index if not exists event_attendees_user_idx on public.event_attendees (user_id);

alter table public.event_attendees enable row level security;

drop policy if exists "attendees readable by active users" on public.event_attendees;
create policy "attendees readable by active users"
  on public.event_attendees for select
  to authenticated
  using (public.is_active());

-- Kamu hanya bisa mendaftarkan DIRIMU SENDIRI. `user_id = auth.uid()` di
-- with check adalah yang mencegah orang iseng menandai orang lain hadir
-- lewat API, sesuatu yang tidak bisa dicegah oleh tombol di UI.
drop policy if exists "users join themselves" on public.event_attendees;
create policy "users join themselves"
  on public.event_attendees for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_active());

drop policy if exists "users update their own attendance" on public.event_attendees;
create policy "users update their own attendance"
  on public.event_attendees for update
  to authenticated
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin())
  with check ((user_id = auth.uid() and public.is_active()) or public.is_admin());

drop policy if exists "users delete their own attendance" on public.event_attendees;
create policy "users delete their own attendance"
  on public.event_attendees for delete
  to authenticated
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin());

-- Kuota ditegakkan di database, bukan cuma dengan menyembunyikan tombol.
-- Dua orang yang menekan "Ikut" pada detik yang sama tetap tidak bisa
-- membuat peserta melebihi max_attendees.
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int;
  taken int;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  select max_attendees into cap from public.events where id = new.event_id;
  if cap is null then
    return new;
  end if;

  select count(*) into taken
  from public.event_attendees
  where event_id = new.event_id
    and status = 'confirmed'
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if taken >= cap then
    raise exception 'Kuota acara ini sudah penuh (% orang).', cap;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_event_capacity on public.event_attendees;
create trigger trg_enforce_event_capacity
  before insert or update on public.event_attendees
  for each row
  execute function public.enforce_event_capacity();

-- 3. weekly_playlists --------------------------------------------------------
-- Satu baris per minggu, dikunci pada tanggal Senin minggu itu.
create table if not exists public.weekly_playlists (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  week_label text not null default '',
  title text not null,
  curator_name text not null default '',
  cover_image_url text not null default '',
  apple_music_embed_url text not null default '',
  apple_music_url text not null default '',
  created_at timestamptz not null default now()
);

alter table public.weekly_playlists enable row level security;

drop policy if exists "playlists readable by active users" on public.weekly_playlists;
create policy "playlists readable by active users"
  on public.weekly_playlists for select
  to authenticated
  using (public.is_active());

drop policy if exists "admins manage playlists" on public.weekly_playlists;
create policy "admins manage playlists"
  on public.weekly_playlists for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- Catatan
-- ============================================================================
-- * Tidak ada seed di sini. Kalau mau isi contoh acara supaya aplikasi tidak
--   kosong saat pertama dibuka, jalankan 0005_seed_events.sql (opsional).
-- * Aplikasi membaca acara beserta pesertanya dalam satu query lewat
--   embedded select PostgREST:
--     events -> event_attendees -> profiles
--   Relasinya sudah terbaca otomatis dari foreign key di atas.
-- ============================================================================
