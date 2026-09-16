-- ============================================================================
-- Weekly Hub — core auth & profiles setup
-- ============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) once per
-- project. This is what actually enforces "who can do what" — the React
-- code only decides what to *show*, never what to *allow*.
-- ============================================================================

-- 1. Departments -------------------------------------------------------------
-- Mirrors src/data/departments.ts. Kept as a real table (not just a frontend
-- array) so the database can validate it with a foreign key instead of trusting
-- whatever string the client sends.
create table if not exists public.departments (
  name text primary key
);

insert into public.departments (name) values
  ('Software Developer'), ('Web Developer'), ('AI Engineer'), ('IT Support'), ('Drafter'),
  ('Digital Marketing'), ('Social Media Strategist'), ('KOL Specialist'), ('Content Creator'),
  ('Videographer'), ('Desain Grafis'), ('Marketing Communication (Marcom)'), ('Public Relation'),
  ('HR (Human Resources)'), ('Legal'), ('Admin Keuangan'), ('Purchasing'), ('Staf Logistik'),
  ('Facilities Management Intern'), ('GA Intern'), ('Manager Intern'),
  ('Pastry Kitchen Staff'), ('Central Kitchen')
on conflict (name) do nothing;

-- RLS must be turned on EXPLICITLY per table — a new table with no RLS is
-- fully open to anyone holding the anon key (which is public by design),
-- for every operation: select, insert, update, delete. Forgetting this line
-- is the single most common way Supabase apps get "usil"-ed.
alter table public.departments enable row level security;

-- Signed-in users may only ever READ this list (e.g. to populate a <select>).
-- No insert/update/delete policy exists for anyone except the table owner
-- (you, via the SQL editor) — so it's read-only from the app's perspective.
create policy "departments are readable by any signed-in user"
  on public.departments for select
  to authenticated
  using (true);

-- 2. Profiles ------------------------------------------------------------
-- One row per auth.users row. `is_admin` lives here, in the database —
-- never in a JWT claim or client-editable field.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  department text not null references public.departments (name),
  department_verified boolean not null default false,
  role text not null check (role in ('employee', 'intern')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone signed in can read every profile — needed for things like the
-- attendee list showing names/departments/avatars of other employees.
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may update their own row, EXCEPT the columns that grant privilege.
-- Postgres RLS can't restrict by column directly, so the privileged fields
-- (is_admin, role, department_verified) are protected by the trigger below
-- instead — this policy only gates *which rows* you may touch at all.
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins may update ANY profile — this is what makes the Admin page's
-- "confirm department" / "change department" actions actually work,
-- enforced here rather than trusted from the client.
create policy "admins can update any profile"
  on public.profiles for update
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  ));

-- Guard rail: even on your OWN row, you cannot promote yourself to admin,
-- change your own role, or self-verify your department. Only an existing
-- admin (caught by the policy above, which runs as a *different* row check)
-- can flip those fields. This trigger closes the loophole where the
-- "update own profile" policy would otherwise let you edit is_admin too.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    -- Editing your own row: privileged fields must stay unchanged
    -- unless the request is coming from an admin (checked separately).
    if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
      new.is_admin := old.is_admin;
      new.role := old.role;
      new.department_verified := old.department_verified;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_privilege_escalation on public.profiles;
create trigger trg_prevent_self_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_privilege_escalation();

-- 3. Auto-create a profile on signup -----------------------------------
-- Runs as part of the same transaction as the auth.users insert, so if it
-- raises an exception, the signup itself fails — this is what lets us
-- restrict signup to company email addresses at the database level,
-- not just with a frontend check that anyone can bypass via the API.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_domain text := 'company.com'; -- keep in sync with VITE_COMPANY_EMAIL_DOMAIN
  email_domain text := split_part(lower(new.email), '@', 2);
begin
  -- Exact match on the part AFTER the @, never a substring check — a
  -- substring check would wrongly accept "user@company.com.evil.com".
  if email_domain <> allowed_domain then
    raise exception 'Sign-up is restricted to % email addresses', allowed_domain;
  end if;

  insert into public.profiles (id, name, email, department, role, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'department', 'IT Support'),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee'),
    false -- nobody is admin by default; an existing admin must grant it
  );
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- Notes
-- ============================================================================
-- * There is no policy granting INSERT/DELETE on profiles to regular users —
--   rows are only created via the trigger above and only removed by cascade
--   when the auth.users row is deleted. This is deliberate.
-- * To make someone an admin: as an existing admin, update their row via the
--   Admin page (or directly: `update profiles set is_admin = true where email = '...'`
--   from the SQL editor, which bypasses RLS because the SQL editor runs as
--   the postgres superuser).
-- * The very first admin has to be granted this way (SQL editor), since no
--   admin exists yet to grant it through the UI.
-- ============================================================================
