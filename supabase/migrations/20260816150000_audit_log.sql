-- Field Book — audit log for admin role changes
--
-- Backs the "who changed whom, old role, new role, when" audit trail for
-- the Edit Role feature in src/app/admin/users.tsx (see src/lib/users.ts's
-- updateUserRole()). Deliberately generic (actor/target/action/old/new)
-- rather than a role_change-specific table, so other admin actions can log
-- into the same table later without a schema change — but only role_change
-- writes exist today.
--
-- Immutability by design: there is an insert policy and a select policy
-- below, but no update or delete policy for any role, admin included. RLS
-- is enabled with zero update/delete policies, which means Postgres denies
-- those commands to anon/authenticated outright — the same "enabled with
-- no policy = no access" pattern the initial schema migration uses
-- elsewhere. An audit trail that admins could quietly edit or delete
-- through the same session that triggers entries in it wouldn't be much of
-- a safeguard.

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  -- Who performed the action. on delete set null (not cascade) — losing the
  -- actor's profile row later shouldn't delete history of what they did.
  actor_id   uuid references public.profiles(id) on delete set null,
  -- Who/what the action was performed on. Same on delete set null reasoning.
  target_id  uuid references public.profiles(id) on delete set null,
  -- e.g. 'role_change'. Free-text rather than a check constraint so future
  -- admin actions can log here without a migration.
  action     text not null,
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);

create index idx_audit_log_target on public.audit_log (target_id);
create index idx_audit_log_actor  on public.audit_log (actor_id);

comment on table public.audit_log is
  'Immutable admin action trail (e.g. role changes). No update/delete policy exists for any role — see migration header.';

alter table public.audit_log enable row level security;

-- An admin can write an audit entry, but only attributed to themselves —
-- actor_id must match the calling session, so one admin can't backdate or
-- attribute an entry to a different admin.
create policy "audit_log_insert_admin" on public.audit_log
for insert to authenticated
with check (public.is_admin() and actor_id = auth.uid());

-- Only admins can read the trail (oversight screen, not yet built —
-- forward-looking, matches how certificate_templates_select_staff was
-- added ahead of its own UI).
create policy "audit_log_select_admin" on public.audit_log
for select to authenticated
using (public.is_admin());
