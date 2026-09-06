-- event_attendees(p_event_id)
--
-- Organizer-facing attendee roster for a SINGLE event the caller owns.
-- Backs OrgAttendeesScreen (src/app/organizer.tsx), replacing its
-- ATTENDEES_BY_EVENT mock.
--
-- Why an RPC (not a plain client query):
--   An organizer already has RLS read access to attendance / registrations
--   / certificates rows for events they own (attendance_select_organizer,
--   registrations_select_organizer, certificates_select_own_organizer in
--   20260816120000 / 20260819120000 / 20260820120000). But `profiles`
--   SELECT is only self (profiles_select_own) or admin (profiles_select_admin)
--   — there is NO organizer policy — so a client-side join to profiles for
--   the student's name returns zero rows. This function resolves the name
--   server-side while exposing ONLY non-sensitive columns.
--
-- Security model — mirrors event_active_registration_counts and the
-- event_certificate_recipients view (20260816120000 / 20260820120000):
--   * SECURITY DEFINER so the internal profiles read bypasses profiles RLS.
--   * `set search_path = public` to pin object resolution.
--   * Authorization is enforced INSIDE the body: the whole result is gated
--     on the caller owning the event (events.organizer_id = auth.uid()).
--     Passing another organizer's event id yields zero rows.
--   * Returns only student_id, full_name, and engagement booleans/timestamp
--     — never email / phone / bio / role. This is strictly what an organizer
--     is already entitled to know about their own event's participants.
--   * Granted to `authenticated` only; anon (auth.uid() is null) gets nothing.
--
-- A "participant" of the event is any student who has EITHER an active
-- ('registered') registration, an attendance record, or an issued
-- certificate for the event — unioned and de-duplicated by student_id.
--
-- Does NOT modify any existing table RLS policy.

create or replace function public.event_attendees(p_event_id uuid)
returns table (
  student_id         uuid,
  full_name          text,
  registered         boolean,
  checked_in         boolean,
  checked_in_at      timestamptz,
  certificate_issued boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with authorized as (
    -- Zero rows (hence zero output) unless the caller owns the event.
    select e.id
      from public.events e
      where e.id = p_event_id
        and e.organizer_id = auth.uid()
  ),
  participants as (
    select r.student_id
      from public.registrations r
      where r.event_id = p_event_id and r.status = 'registered'
    union
    select a.student_id
      from public.attendance a
      where a.event_id = p_event_id
    union
    select c.student_id
      from public.certificates c
      where c.event_id = p_event_id and c.student_id is not null
  )
  select
    p.id                                        as student_id,
    p.full_name                                 as full_name,
    (reg.student_id is not null)                as registered,
    (att.student_id is not null)                as checked_in,
    att.recorded_at                             as checked_in_at,
    coalesce(cert.has_cert, false)              as certificate_issued
  from authorized
  join participants        pp   on true
  join public.profiles     p    on p.id = pp.student_id
  -- registrations / attendance are unique per (student_id, event_id), so
  -- these left joins are 1:1 and cannot fan out rows.
  left join public.registrations reg
    on reg.event_id = p_event_id and reg.student_id = pp.student_id and reg.status = 'registered'
  left join public.attendance att
    on att.event_id = p_event_id and att.student_id = pp.student_id
  -- certificates has no per-(student,event) unique constraint, so collapse
  -- to a single existence flag to avoid multiplying the row per certificate.
  left join (
    select c.student_id, true as has_cert
      from public.certificates c
      where c.event_id = p_event_id and c.student_id is not null
      group by c.student_id
  ) cert on cert.student_id = pp.student_id
  order by (att.recorded_at is null), att.recorded_at asc, p.full_name asc;
$$;

grant execute on function public.event_attendees(uuid) to authenticated;
