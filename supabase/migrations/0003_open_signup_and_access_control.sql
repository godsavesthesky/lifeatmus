-- ============================================================================
-- Weekly Hub — pendaftaran terbuka + pencabutan akses
-- ============================================================================
-- Aman dijalankan ulang (idempotent). Kalau migrasi ini sudah pernah kamu
-- jalankan di Supabase, menjalankannya lagi tidak merusak apa pun — semua
-- perintah memakai `if not exists` / `create or replace` / `drop ... if exists`.
--
-- Isi:
--   1. Kolom akses di profiles (is_active, access_revoked_at, ...)
--   2. Fungsi penolong is_admin() dan is_active() — SECURITY DEFINER
--   3. Kebijakan RLS profiles ditulis ulang supaya menghormati is_active
--   4. handle_new_user tanpa batasan domain email
--   5. Penjaga ensure_admin_remains()
-- ============================================================================

-- 1. Kolom akses -------------------------------------------------------------
-- ALTER TABLE harus jalan DULUAN, sebelum fungsi apa pun yang menyebut kolom
-- ini dibuat. Fungsi `language sql` divalidasi terhadap skema saat
-- CREATE FUNCTION (beda dengan plpgsql yang baru divalidasi saat dipanggil),
-- jadi urutan terbalik akan gagal dengan "column does not exist".
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists access_revoked_at timestamptz;
alter table public.profiles add column if not exists access_revoked_reason text;

-- Divisi boleh 'Unassigned' untuk orang yang baru daftar dan belum diperiksa.
insert into public.departments (name) values ('Unassigned') on conflict (name) do nothing;

-- 2. Fungsi penolong ---------------------------------------------------------
-- Kenapa SECURITY DEFINER: kebijakan RLS di tabel `profiles` yang melakukan
-- SELECT ke `profiles` akan memicu kebijakannya sendiri → rekursi tak
-- terhingga. Fungsi SECURITY DEFINER berjalan sebagai pemilik tabel sehingga
-- RLS dilewati di dalamnya, memutus lingkaran itu.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin and p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_active() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active() to authenticated;

-- 3. Kebijakan RLS profiles --------------------------------------------------
drop policy if exists "profiles are readable by any signed-in user" on public.profiles;
drop policy if exists "profiles are readable by active users" on public.profiles;
drop policy if exists "users can update their own profile" on public.profiles;
drop policy if exists "admins can update any profile" on public.profiles;

-- Orang yang aksesnya dicabut tetap boleh membaca BARIS DIRINYA SENDIRI.
-- Tanpa ini aplikasi tidak bisa tahu kenapa datanya kosong, jadi tidak bisa
-- menjelaskan apa pun — cuma layar kosong yang membingungkan.
create policy "profiles are readable by active users"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_active());

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_active())
  with check (id = auth.uid());

create policy "admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- departments: ikut aturan yang sama supaya user nonaktif tidak bisa
-- memuat daftar divisi juga.
drop policy if exists "departments are readable by any signed-in user" on public.departments;
drop policy if exists "departments are readable by active users" on public.departments;
create policy "departments are readable by active users"
  on public.departments for select
  to authenticated
  using (public.is_active());

-- 4. Pendaftaran terbuka -----------------------------------------------------
-- Batasan domain email dilepas: tidak semua orang kantor punya email domain
-- yang sama. Gantinya, setiap akun baru masuk dengan department_verified =
-- false dan harus diperiksa admin di halaman Admin — dan admin bisa mencabut
-- aksesnya kalau ternyata orang luar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted_department text := coalesce(new.raw_user_meta_data ->> 'department', 'Unassigned');
  wanted_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'employee'));
begin
  -- Jangan percaya string divisi dari klien: kalau bukan divisi yang kita
  -- kenal, jatuhkan ke 'Unassigned' daripada menggagalkan pendaftaran
  -- dengan error foreign key yang tidak bisa dibaca orang.
  if not exists (select 1 from public.departments d where d.name = wanted_department) then
    wanted_department := 'Unassigned';
  end if;

  if wanted_role not in ('employee', 'intern') then
    wanted_role := 'employee';
  end if;

  insert into public.profiles (id, name, email, department, department_verified, role, is_admin, is_active)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    new.email,
    wanted_department,
    false, -- selalu perlu diperiksa admin
    wanted_role,
    false, -- tidak ada admin otomatis
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 5. Penjaga admin terakhir --------------------------------------------------
-- Tanpa ini, satu klik salah di halaman Admin bisa mengunci semua orang dari
-- halaman Admin — dan satu-satunya jalan keluar adalah SQL editor.
create or replace function public.ensure_admin_remains()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admins_left int;
begin
  if (old.is_admin and not new.is_admin) or (old.is_admin and old.is_active and not new.is_active) then
    select count(*) into admins_left
    from public.profiles
    where is_admin and is_active and id <> old.id;

    if admins_left = 0 then
      raise exception 'Tidak bisa: ini admin aktif terakhir. Angkat admin lain dulu.';
    end if;
  end if;

  -- Rapikan jejak pencabutan supaya konsisten walau UI lupa mengisinya.
  if old.is_active and not new.is_active then
    new.access_revoked_at := coalesce(new.access_revoked_at, now());
  elsif not old.is_active and new.is_active then
    new.access_revoked_at := null;
    new.access_revoked_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ensure_admin_remains on public.profiles;
create trigger trg_ensure_admin_remains
  before update on public.profiles
  for each row
  execute function public.ensure_admin_remains();

-- ============================================================================
-- Admin pertama tetap harus diangkat manual lewat SQL editor:
--   update public.profiles set is_admin = true where email = 'kamu@email.com';
-- ============================================================================
