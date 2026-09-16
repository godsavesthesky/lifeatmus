-- ============================================================================
-- Weekly Hub — audit log for privileged changes
-- ============================================================================
-- Records every change to is_admin, role, or department_verified — who
-- changed it, on whose profile, from what to what, when. Regular users
-- cannot read, edit, or delete this table at all (no policies granted to
-- `authenticated`), so a curious/"usil" employee cannot cover their tracks
-- even if they somehow found a way to trigger a change.
-- ============================================================================

create table if not exists public.profile_audit_log (
  id bigint generated always as identity primary key,
  changed_profile_id uuid not null references public.profiles (id) on delete cascade,
  changed_by uuid references public.profiles (id),
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

alter table public.profile_audit_log enable row level security;
-- Deliberately: no policies at all here. RLS with zero policies means
-- `authenticated` and `anon` are both denied every operation. Only the
-- table owner (you, via the SQL editor / Supabase dashboard) can read it.

create or replace function public.log_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_admin is distinct from new.is_admin then
    insert into public.profile_audit_log (changed_profile_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'is_admin', old.is_admin::text, new.is_admin::text);
  end if;

  if old.role is distinct from new.role then
    insert into public.profile_audit_log (changed_profile_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'role', old.role, new.role);
  end if;

  if old.department_verified is distinct from new.department_verified then
    insert into public.profile_audit_log (changed_profile_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'department_verified', old.department_verified::text, new.department_verified::text);
  end if;

  return new;
end;
$$;

-- Fires AFTER the update, once Postgres has already applied whatever the
-- BEFORE trigger (trg_prevent_self_privilege_escalation, migration 0001)
-- decided the final values should be — so this always logs what actually
-- got saved, not what was merely attempted.
drop trigger if exists trg_log_profile_privilege_changes on public.profiles;
create trigger trg_log_profile_privilege_changes
  after update on public.profiles
  for each row
  execute function public.log_profile_privilege_changes();
