-- landing_ledger()
--
-- Public (anonymous) data source for the landing page ledger card
-- (HeroLedger in src/app/shared.tsx). Replaces its hard-coded sample data.
--
-- Why an RPC:
--   profiles / events / attendance / registrations are protected by
--   authenticated-only RLS. Rather than loosening any policy, this function
--   exposes a single, minimal, masked jsonb payload to `anon`.
--
-- Security model (follows 20260822120000_event_attendees_rpc.sql):
--   * SECURITY DEFINER so the internal reads bypass RLS.
--   * `set search_path = public` to pin object resolution.
--   * Takes no arguments, so there is no injection surface.
--   * Returns ONLY: ledger_id, title, event_date, venue, code, and rows of
--     { display_name, masked_id, checked_in, checked_in_at }.
--     Never an email, a full name, or a full profile UUID.
--   * EXECUTE revoked from PUBLIC, granted to anon + authenticated.
--
-- Selection:
--   * Featured event = event holding the most recent attendance.recorded_at.
--     No attendance anywhere => the function returns SQL NULL.
--   * Participants = checked-in students (attendance) plus registered
--     students (registrations.status = 'registered') with no attendance row.
--     A student with both appears once, as checked in.
--   * At most 5 rows. Checked-in first (most recent first), then registered.
--   * Pinned student (the project owner): looked up by email first, then by
--     full name 'Prince Naruka'; the email match wins if both exist. They are
--     pinned only when they are a participant of the featured event, in which
--     case they are guaranteed a slot and sort first within their status group.
--     If they are not a participant (or have no profile) nothing is pinned;
--     no row is ever fabricated.
--
-- Formats:
--   display_name : "First L." (single-word names are returned as-is)
--   masked_id    : one uppercase initial per name word (up to 3) + '-' +
--                  last 4 hex chars of the profile UUID, uppercase (PN-7F2A)
--   ledger_id    : 'FB-' || YYYY of event_date || '-' || last 4 hex of event id
--
-- Does NOT modify any existing table RLS policy.

create or replace function public.landing_ledger()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with featured as (
    -- Event holding the most recent attendance row.
    select e.id, e.title, e.event_date, e.venue, e.code
      from public.events e
      join public.attendance a on a.event_id = e.id
     group by e.id
     order by max(a.recorded_at) desc, e.id
     limit 1
  ),
  pinned as (
    -- Owner lookup lives in SQL only. Email match is preferred over the
    -- full-name match when both exist.
    select p.id
      from public.profiles p
     where lower(p.email) = lower('narukaprince489@gmail.com')
        or lower(btrim(p.full_name)) = 'prince naruka'
     order by (lower(p.email) = lower('narukaprince489@gmail.com')) desc, p.id
     limit 1
  ),
  participants as (
    -- Checked in (attendance wins over registration; each student once).
    select a.student_id, true as checked_in, a.recorded_at as checked_in_at
      from public.attendance a
      join featured f on f.id = a.event_id
    union all
    -- Registered but not checked in.
    select r.student_id, false, null::timestamptz
      from public.registrations r
      join featured f on f.id = r.event_id
     where r.status = 'registered'
       and not exists (
         select 1
           from public.attendance a2
          where a2.event_id = r.event_id
            and a2.student_id = r.student_id)
  ),
  named as (
    select
      pa.checked_in,
      pa.checked_in_at,
      (pa.student_id = (select id from pinned)) as is_pinned,
      -- Display_Name: "First L." or the single word as-is.
      case when array_length(w.words, 1) = 1 then w.words[1]
           else w.words[1] || ' '
                || upper(left(w.words[array_length(w.words, 1)], 1)) || '.'
      end as display_name,
      -- Masked_ID: up to 3 uppercase initials + '-' + last 4 of the UUID.
      (select upper(string_agg(left(x, 1), '' order by ord))
         from unnest(w.words[1:3]) with ordinality as t(x, ord))
        || '-' || upper(right(replace(pa.student_id::text, '-', ''), 4)) as masked_id
      from participants pa
      join public.profiles p on p.id = pa.student_id
      cross join lateral (
        select regexp_split_to_array(btrim(p.full_name), '\s+') as words
      ) w
     where btrim(p.full_name) <> ''
  ),
  selected as (
    -- The pinned student is guaranteed a slot, then checked-in by recency,
    -- then registered. Hard cap of 5.
    select *
      from named
     order by is_pinned desc, checked_in desc, checked_in_at desc nulls last, display_name
     limit 5
  )
  select jsonb_build_object(
           'ledger_id',  'FB-' || to_char(f.event_date, 'YYYY') || '-'
                           || upper(right(replace(f.id::text, '-', ''), 4)),
           'title',      f.title,
           'event_date', f.event_date,
           'venue',      f.venue,
           'code',       f.code,
           'rows', coalesce((
             -- Display order: checked-in group first, pinned first in a group.
             select jsonb_agg(
                      jsonb_build_object(
                        'display_name',  s.display_name,
                        'masked_id',     s.masked_id,
                        'checked_in',    s.checked_in,
                        'checked_in_at', s.checked_in_at)
                      order by s.checked_in desc, s.is_pinned desc,
                               s.checked_in_at desc nulls last, s.display_name)
               from selected s), '[]'::jsonb))
    from featured f;  -- zero featured rows => SQL NULL
$$;

revoke all on function public.landing_ledger() from public;
grant execute on function public.landing_ledger() to anon, authenticated;
