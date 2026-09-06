-- Registrations table
-- Records that a student INTENDS to attend an event ("secures a spot").
-- Deliberately separate from `attendance` (20260819120000_attendance.sql):
--   registration = intent to attend   (capacity-bound, cancellable)
--   attendance   = actually checked in (append-only, via QR scan)
-- A student may register without attending, or attend without registering
-- (the QR scanner records attendance independently and is NOT gated on a
-- registration existing). The two tables share the (student_id, event_id)
-- shape but neither references the other.

create table public.registrations (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  event_id      uuid not null references public.events(id)   on delete cascade,
  -- Cancellation is modelled as a status flip, not a row delete, so history
  -- is preserved and a student can re-register (flip back to 'registered')
  -- against the same row. This is the intentional divergence from the
  -- append-only `attendance` table.
  status        text not null default 'registered'
                  check (status in ('registered', 'cancelled')),
  registered_at timestamptz not null default now(),
  cancelled_at  timestamptz,

  -- One registration row per student per event (a re-registration updates
  -- this row rather than inserting a duplicate).
  constraint registrations_student_event_unique unique (student_id, event_id)
);

create index idx_registrations_student on public.registrations (student_id);
create index idx_registrations_event   on public.registrations (event_id);
-- Partial index: capacity counts and "spots left" only ever count active
-- ('registered') rows, so this keeps that aggregate cheap.
create index idx_registrations_event_active
  on public.registrations (event_id) where status = 'registered';

comment on table public.registrations is
  'Student intent-to-attend per event. Distinct from attendance (actual check-in). Cancellation is a status flip, not a delete.';

-- ─────────────────────────────────────────────────────────────────────────
-- Row-Level Security
--
-- Mirrors the attendance table's policy shapes and reuses the existing
-- public.is_admin() helper (20260816120000_rls_policies.sql). All policies
-- scoped `to authenticated`; none apply to `anon`.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.registrations enable row level security;

-- Students read only their own registrations.
create policy registrations_select_own on public.registrations
  for select to authenticated
  using (student_id = auth.uid());

-- Organizers read registrations for events they own.
create policy registrations_select_organizer on public.registrations
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = auth.uid()
    )
  );

-- Admins read every registration.
create policy registrations_select_admin on public.registrations
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- Students may create only their own registration, and only in the
-- 'registered' state. (The register_for_event RPC below is the capacity-safe
-- path and also runs as the caller for this check; a direct client insert
-- remains possible but is subject to this policy and the unique constraint.)
create policy registrations_insert_own on public.registrations
  for insert to authenticated
  with check (student_id = auth.uid() and status = 'registered');

-- Students may update only their own registration (cancel / re-register).
-- They cannot reassign a row to another student.
create policy registrations_update_own on public.registrations
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- No student DELETE policy: cancellation is a status flip, not a delete.

-- ─────────────────────────────────────────────────────────────────────────
-- register_for_event(p_event_id)
--
-- Capacity-safe registration. A plain client-side count-then-insert can
-- overbook under concurrency (two clients both read count < capacity and
-- both insert). This function takes a row lock on the target event
-- (`select ... for update`) so concurrent registrations for the same event
-- serialize on that row, making the count+insert atomic.
--
-- SECURITY DEFINER so the lock/count/insert run as one privileged unit,
-- consistent with the app's other SECURITY DEFINER functions
-- (handle_new_user, current_profile_role). The student id is taken from
-- auth.uid() inside the function — a caller cannot register anyone else.
--
-- Raises:
--   event_not_found  — no such event
--   event_full       — capacity reached (only active 'registered' rows count)
-- On success returns the registrations row (fresh insert, or a reactivated
-- previously-cancelled row).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.register_for_event(p_event_id uuid)
returns public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_capacity int;
  v_active   int;
  v_row      public.registrations;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Lock the event row for the duration of the transaction so concurrent
  -- registrations for this event cannot interleave between the count and
  -- the insert.
  select capacity into v_capacity
    from public.events
    where id = p_event_id
    for update;

  if not found then
    raise exception 'event_not_found';
  end if;

  -- If the caller already has an active registration, return it as-is
  -- (idempotent — no double counting, no error).
  select * into v_row
    from public.registrations
    where student_id = v_uid and event_id = p_event_id;

  if found and v_row.status = 'registered' then
    return v_row;
  end if;

  -- Count only active registrations toward capacity. capacity = 0 is treated
  -- as "no limit" here to match how the events table defaults capacity (0)
  -- for events created without an explicit cap.
  if v_capacity is not null and v_capacity > 0 then
    select count(*) into v_active
      from public.registrations
      where event_id = p_event_id and status = 'registered';

    if v_active >= v_capacity then
      raise exception 'event_full';
    end if;
  end if;

  insert into public.registrations (student_id, event_id, status, registered_at, cancelled_at)
    values (v_uid, p_event_id, 'registered', now(), null)
  on conflict (student_id, event_id) do update
    set status = 'registered', registered_at = now(), cancelled_at = null
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.register_for_event(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- cancel_registration(p_event_id)
--
-- Flips the caller's own registration for the given event to 'cancelled'
-- (freeing a seat). No lock needed — cancelling only reduces the active
-- count. Runs as the caller (SECURITY INVOKER, the default) so
-- registrations_update_own governs it and a student can only cancel their
-- own row. No-op if there is no row / already cancelled.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.cancel_registration(p_event_id uuid)
returns void
language sql
set search_path = public
as $$
  update public.registrations
    set status = 'cancelled', cancelled_at = now()
    where student_id = auth.uid()
      and event_id = p_event_id
      and status = 'registered';
$$;

grant execute on function public.cancel_registration(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- event_active_registration_counts(p_event_ids)
--
-- Returns, per requested event id, the number of ACTIVE ('registered')
-- registrations — the figure needed to compute "spots left"
-- (capacity - active) on the student Explore/Detail screens.
--
-- This must be SECURITY DEFINER: a student's own registrations_select RLS
-- only lets them see THEIR rows, so a normal client query cannot produce a
-- global per-event count. This function exposes ONLY an aggregate integer
-- per event id — never any student identity or row — so it leaks nothing
-- that "spots left" doesn't already imply. It is scoped to the specific
-- event ids the caller asks about (typically the events already visible to
-- them via events_select_public).
--
-- Returns rows (event_id, active_count) only for ids that exist; callers
-- treat a missing id as 0.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.event_active_registration_counts(p_event_ids uuid[])
returns table (event_id uuid, active_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*) as active_count
    from public.registrations r
    where r.event_id = any(p_event_ids)
      and r.status = 'registered'
    group by r.event_id;
$$;

grant execute on function public.event_active_registration_counts(uuid[]) to authenticated;
