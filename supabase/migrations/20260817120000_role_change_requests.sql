-- Field Book — role change requests
--
-- Lets any signed-in user request a change to their own role (e.g.
-- student -> organizer), which sits in a queue until an admin explicitly
-- approves or rejects it. Approval is the ONLY path that ever writes
-- profiles.role on a user's behalf from this feature — there is no
-- self-service write here, matching the existing constraint already
-- enforced by profiles_update_own's `with check (role =
-- current_profile_role())`: a user cannot change their own role even
-- through a different table/RPC without an admin in the loop.
--
-- Modeled directly on the `approvals` table (20260815120000_initial_schema.sql)
-- and its RLS (20260816120000_rls_policies.sql) — same pending/approved/
-- rejected status shape, same "self can read/insert their own, only admin
-- can update" split. Resolution (approve/reject) goes through two
-- SECURITY DEFINER functions below rather than a plain client-side UPDATE,
-- because approval has to move `role_change_requests.status` AND
-- `profiles.role` AND an `audit_log` entry together — a plain RLS-gated
-- UPDATE from the client could only ever touch one table per statement,
-- risking a request marked "approved" whose profiles.role update failed
-- (or the reverse). Wrapping both in one function keeps them atomic.
--
-- Note on requestable target roles: 'admin' IS allowed as a requested_role
-- here, even though profiles_insert_own/profiles_update_own forbid
-- self-assigning 'admin'. That restriction exists specifically to stop an
-- unreviewed self-service write; it doesn't apply here because nothing in
-- this table ever changes profiles.role by itself — every approval is an
-- explicit admin action via profiles_update_admin (which already has no
-- role restriction — see admin/users.tsx's EditRoleModal, which lets an
-- admin promote anyone to Admin today). Requesting 'admin' just means an
-- admin has to explicitly click Approve for it to take effect, same as any
-- other request.

-- ─────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────

-- "current_role" is quoted throughout this migration (table definition,
-- RLS policy, and both RPC functions below) because CURRENT_ROLE is a
-- reserved keyword in PostgreSQL (a niladic SQL-standard construct, same
-- category as CURRENT_USER/SESSION_USER) — an unquoted bare use of it
-- anywhere, including as a column name, is a syntax error, not just a
-- naming clash. Quoting rather than renaming: the frontend
-- (src/lib/roleRequests.ts) already selects/inserts this exact column
-- name as "current_role" in its PostgREST queries, so quoting keeps the
-- column name unchanged and requires no frontend changes, whereas a
-- rename would need every one of those call sites updated too.
create table public.role_change_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  "current_role" text not null check ("current_role" in ('student', 'organizer', 'admin')),
  requested_role text not null check (requested_role in ('student', 'organizer', 'admin')),
  -- A request to "change" to the role you already hold isn't a role change.
  constraint role_change_requests_role_differs check (requested_role <> "current_role"),
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  reason         text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz,
  reviewed_by    uuid references public.profiles(id) on delete set null,
  admin_note     text
);

create index idx_role_change_requests_user on public.role_change_requests (user_id);
create index idx_role_change_requests_status on public.role_change_requests (status);

-- Enforces "no duplicate pending requests" at the database level (belt and
-- suspenders alongside the same check the UI/insert policy also make) —
-- a partial unique index rather than a plain unique constraint since
-- multiple resolved (approved/rejected) requests per user are expected and
-- fine; only a *second concurrently pending* one is disallowed.
create unique index idx_role_change_requests_one_pending_per_user
  on public.role_change_requests (user_id)
  where (status = 'pending');

comment on table public.role_change_requests is
  'User-initiated requests to change their own profiles.role. Resolved only via approve_role_change_request()/reject_role_change_request() below — never a direct client UPDATE. See RLS: no self-service update policy exists on this table at all.';

alter table public.role_change_requests enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS (mirrors approvals' self/admin split)
-- ─────────────────────────────────────────────────────────────────────────

-- A user can see their own request history (pending + resolved).
create policy "role_change_requests_select_own" on public.role_change_requests
for select to authenticated
using (user_id = auth.uid());

-- Admins can see every request (the review queue).
create policy "role_change_requests_select_admin" on public.role_change_requests
for select to authenticated
using (public.is_admin());

-- A user can submit a request only for themselves, only stating their own
-- actual current role (current_profile_role(), SECURITY DEFINER, avoids
-- re-entering this table's own RLS), and only in the initial 'pending'
-- state with no review fields pre-filled — closes off a client trying to
-- insert a row that's already "approved" or attributed to a reviewer.
create policy "role_change_requests_insert_own" on public.role_change_requests
for insert to authenticated
with check (
  user_id = auth.uid()
  and "current_role" = public.current_profile_role()
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
);

-- Only admins resolve requests, and only through the functions below in
-- practice (RLS itself can't require "via this function", but there is no
-- other UPDATE policy — including none for the requesting user — so
-- self-approval is impossible regardless of client code).
create policy "role_change_requests_update_admin" on public.role_change_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin-only cleanup/deletion (audit trail of the request itself still
-- lives in audit_log independently once resolved — see the functions below).
create policy "role_change_requests_delete_admin" on public.role_change_requests
for delete to authenticated
using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Resolution functions
--   SECURITY DEFINER so a single call can atomically touch three tables
--   (role_change_requests, profiles, audit_log) that no single RLS policy
--   spans. Both re-check public.is_admin() internally before doing
--   anything — SECURITY DEFINER bypasses RLS, so that in-function check is
--   the only thing standing between "any authenticated caller" and a role
--   change; it is not optional defense-in-depth here, it's the actual gate.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.approve_role_change_request(
  p_request_id uuid,
  p_admin_note text default null
)
returns public.role_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.role_change_requests;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve role change requests.' using errcode = '42501';
  end if;

  select * into v_request
  from public.role_change_requests
  where id = p_request_id
  for update;

  if v_request is null then
    raise exception 'Role change request not found.' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request has already been resolved.' using errcode = '22023';
  end if;

  update public.role_change_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      admin_note = p_admin_note
  where id = p_request_id
  returning * into v_request;

  update public.profiles
  set role = v_request.requested_role
  where id = v_request.user_id;

  insert into public.audit_log (actor_id, target_id, action, old_value, new_value)
  values (auth.uid(), v_request.user_id, 'role_change_request_approved',
          v_request."current_role", v_request.requested_role);

  return v_request;
end;
$$;

create or replace function public.reject_role_change_request(
  p_request_id uuid,
  p_admin_note text default null
)
returns public.role_change_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.role_change_requests;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject role change requests.' using errcode = '42501';
  end if;

  select * into v_request
  from public.role_change_requests
  where id = p_request_id
  for update;

  if v_request is null then
    raise exception 'Role change request not found.' using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request has already been resolved.' using errcode = '22023';
  end if;

  update public.role_change_requests
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      admin_note = p_admin_note
  where id = p_request_id
  returning * into v_request;

  insert into public.audit_log (actor_id, target_id, action, old_value, new_value)
  values (auth.uid(), v_request.user_id, 'role_change_request_rejected',
          v_request."current_role", v_request.requested_role);

  return v_request;
end;
$$;

grant execute on function public.approve_role_change_request(uuid, text) to authenticated;
grant execute on function public.reject_role_change_request(uuid, text) to authenticated;
