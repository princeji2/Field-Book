-- Field Book — notification metadata + trusted server-side generation
--
-- Backend/database portion of the approved Stage 3C notifications design.
-- Builds ON TOP OF:
--   * 20260815120000_initial_schema.sql  — public.notifications base table
--       (id, user_id → profiles(id) on delete cascade, message, read,
--        created_at) + idx_notifications_user / idx_notifications_unread.
--   * 20260816120000_rls_policies.sql    — the 6 notifications RLS policies
--       (select_own, select_admin, update_own, insert_admin, delete_own,
--        delete_admin). This migration DOES NOT add, drop, or alter any of
--        those policies. In particular there is deliberately still NO
--        student/organizer INSERT policy — the only ways a row can be
--        created remain (a) an admin via notifications_insert_admin, or
--        (b) the SECURITY DEFINER create_notification() function below,
--        which bypasses RLS by design. A signed-in student cannot fabricate
--        a notification (for themselves or anyone else) via a direct insert.
--   * 20260819120000_attendance.sql      — public.attendance
--       (student_id, event_id, recorded_at).
--   * 20260820120000_registrations.sql   — public.registrations
--       (student_id, event_id, status 'registered'|'cancelled', ...).
--   * 20260816160000_certificate_url.sql — public.certificates now has
--       certificate_url; base columns event_id (nullable), student_id
--       (nullable), certificate_code, issued_at.
--
-- Additive only: no column drops, no policy changes, no data rewrites. The
-- existing message/read/created_at columns and both notifications indexes
-- are untouched.
--
-- Reminders (event_reminder) are intentionally NOT implemented here — they
-- require a scheduler (pg_cron / external cron) and are out of scope for
-- this step. The category is allowed by the CHECK constraint so the column
-- is forward-compatible, but nothing in this migration ever inserts one.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Schema additions on public.notifications
-- ═══════════════════════════════════════════════════════════════════════

-- category: what kind of notification this is. Drives the icon/eyebrow the
-- UI renders. Defaults to 'general' so the existing admin-only insert path
-- (notifications_insert_admin) and any future manual insert stay valid
-- without having to specify a category. The CHECK enumerates every
-- supported value, including 'event_reminder' (reserved for a later step)
-- and 'general' (fallback / admin broadcasts).
alter table public.notifications
  add column if not exists category text not null default 'general'
    check (category in (
      'certificate_issued',
      'registration_confirmed',
      'registration_cancelled',
      'attendance_confirmed',
      'event_reminder',
      'general'
    ));

-- event_id: optional deep-link to the event this notification is about.
-- on delete set null (NOT cascade) so removing an event neutralizes the
-- link without erasing the student's notification history. Nullable because
-- 'general' / broadcast notifications aren't tied to an event.
alter table public.notifications
  add column if not exists event_id uuid references public.events(id) on delete set null;

-- metadata: small, display-only extra payload (e.g. certificate_code,
-- event code) for the UI's eyebrow line. Non-authoritative — never used for
-- authorization. jsonb for flexibility; nullable.
alter table public.notifications
  add column if not exists metadata jsonb;

comment on column public.notifications.category is
  'Notification type; drives UI icon/eyebrow. One of certificate_issued | registration_confirmed | registration_cancelled | attendance_confirmed | event_reminder | general. Server-generated rows set this via create_notification(); admin/manual inserts default to general.';
comment on column public.notifications.event_id is
  'Optional event this notification refers to (deep-link). on delete set null so event removal does not erase notification history.';
comment on column public.notifications.metadata is
  'Display-only extra payload (e.g. { "code": "CERT-FB-..." }). Non-authoritative; never used for access control.';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Dedupe unique index
--
-- Guarantees at most ONE notification per (user, category, event) for the
-- event-driven "one-shot" categories, so ON CONFLICT DO NOTHING in
-- create_notification() silently no-ops on a repeat rather than piling up
-- duplicates. Examples this prevents:
--   * a registration reactivation (cancelled -> registered again) firing a
--     second 'registration_confirmed' for the same event, and
--   * any accidental double-fire of the certificate/attendance triggers.
--
-- Scoped as a PARTIAL index so it does NOT constrain 'general' or
-- 'event_reminder' (which legitimately recur and/or have no event_id):
--   * only rows with a non-null event_id AND one of the one-shot categories
--     participate in the uniqueness.
-- 'registration_confirmed' and 'registration_cancelled' are distinct
-- categories, so a register -> cancel -> register cycle can still record
-- one confirmation and one cancellation for the same event without
-- colliding with each other.
create unique index if not exists notifications_dedupe_unique
  on public.notifications (user_id, category, event_id)
  where event_id is not null
    and category in (
      'certificate_issued',
      'registration_confirmed',
      'registration_cancelled',
      'attendance_confirmed'
    );

-- ═══════════════════════════════════════════════════════════════════════
-- 3. create_notification() — the single trusted write chokepoint
--
-- SECURITY DEFINER so it can insert a notifications row on a student's
-- behalf despite there being no student INSERT policy (mirrors the pattern
-- of handle_new_user / register_for_event). set search_path = public to
-- prevent search-path hijacking of a definer function.
--
-- Deliberately NOT granted to authenticated: it writes an arbitrary
-- user_id, so exposing it to clients would let any user create
-- notifications for anyone. Only the triggers below (which run with this
-- function's owner privileges as part of the definer chain) invoke it. The
-- triggers always derive user_id from the owning row's student_id, never
-- from client input.
--
-- Uses ON CONFLICT DO NOTHING against notifications_dedupe_unique so a
-- repeat call for the same (user, category, event) is a safe no-op.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.create_notification(
  p_user_id  uuid,
  p_category text,
  p_message  text,
  p_event_id uuid    default null,
  p_metadata jsonb   default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ignore calls with no target user (e.g. a certificates row whose
  -- student_id is null — student_id is nullable on that table).
  if p_user_id is null then
    return;
  end if;

  insert into public.notifications (user_id, category, message, event_id, metadata)
  values (p_user_id, p_category, p_message, p_event_id, p_metadata)
  on conflict (user_id, category, event_id)
    where event_id is not null
      and category in (
        'certificate_issued',
        'registration_confirmed',
        'registration_cancelled',
        'attendance_confirmed'
      )
  do nothing;
end;
$$;

comment on function public.create_notification(uuid, text, text, uuid, jsonb) is
  'Trusted server-side notification insert (SECURITY DEFINER). Sole non-admin write path into notifications. Not granted to authenticated; only called by the notification triggers, which derive user_id from the owning row. Deduped via ON CONFLICT DO NOTHING on notifications_dedupe_unique.';

-- No GRANT EXECUTE to authenticated/anon on purpose — see comment above.

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Trigger: registrations -> registration_confirmed / registration_cancelled
--
-- Fires only on a TRANSITION into a state, so unrelated updates to a
-- registrations row don't spam notifications:
--   * INSERT with status 'registered'                     -> confirmed
--   * UPDATE where status becomes 'registered' (was not)  -> confirmed
--     (covers a cancelled -> registered reactivation; dedupe index means
--      a repeat confirmation for the same event is a no-op)
--   * UPDATE where status becomes 'cancelled' (was not)   -> cancelled
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.notify_on_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'registered' then
      perform public.create_notification(
        new.student_id,
        'registration_confirmed',
        'Registration confirmed.',
        new.event_id,
        null
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status = 'registered' and old.status is distinct from 'registered' then
      perform public.create_notification(
        new.student_id,
        'registration_confirmed',
        'Registration confirmed.',
        new.event_id,
        null
      );
    elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      perform public.create_notification(
        new.student_id,
        'registration_cancelled',
        'Registration cancelled.',
        new.event_id,
        null
      );
    end if;
  end if;

  return null; -- AFTER trigger: return value ignored.
end;
$$;

create trigger trg_notify_on_registration
  after insert or update on public.registrations
  for each row execute function public.notify_on_registration();

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Trigger: attendance -> attendance_confirmed
--
-- attendance is append-only (one row per student+event, unique). A single
-- AFTER INSERT is all that's needed.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.notify_on_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.student_id,
    'attendance_confirmed',
    'Attendance confirmed.',
    new.event_id,
    null
  );
  return null;
end;
$$;

create trigger trg_notify_on_attendance
  after insert on public.attendance
  for each row execute function public.notify_on_attendance();

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Trigger: certificates -> certificate_issued
--
-- The certificates row is inserted server-side by certificate-service
-- (service-role key) right after the PDF upload. An AFTER INSERT trigger
-- here keeps notification generation backend-agnostic (no Java change) and
-- covers the admin-only manual insert path too. student_id is nullable on
-- certificates, so create_notification()'s own null-guard handles the case
-- where a certificate has no linked student. certificate_code is carried in
-- metadata for the UI eyebrow line.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.notify_on_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.student_id,
    'certificate_issued',
    'Certificate issued.',
    new.event_id,
    jsonb_build_object('code', new.certificate_code)
  );
  return null;
end;
$$;

create trigger trg_notify_on_certificate
  after insert on public.certificates
  for each row execute function public.notify_on_certificate();
