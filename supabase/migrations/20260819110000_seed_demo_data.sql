-- Field Book — seed demo/sample data
--
-- Populates the Admin Dashboard / Admin Approvals with realistic-looking
-- pending, approved, and rejected submissions, plus a realistic Platform
-- Activity feed — as real rows in `events` / `approvals` /
-- `platform_activity`, not hardcoded UI arrays. Per product request: keep
-- the dashboard looking populated even before any real organizer has
-- submitted anything, without reintroducing client-side mock state.
--
-- Demo organizer profiles (Prof. Linda Okonkwo, Dr. Yusuf Amara,
-- Dr. Mei-Ling Zhao) were created via the Supabase Auth Admin API before
-- this migration ran — `events.organizer_id` / `approvals.reviewed_by`
-- are real FKs into `profiles`, which itself FKs into `auth.users`, so
-- these rows cannot be faked without a backing auth.users row (unlike
-- e.g. platform_activity.actor_id, which is nullable and left null for
-- most seeded rows below). Their ids are hardcoded here since they were
-- allocated by Auth at creation time.
--
-- All inserts are idempotent (guarded by `where not exists`) so this
-- migration is safe to include in `supabase db push` more than once and
-- safe to run against a database that already has this seed data.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Demo events (owned by the three demo organizer profiles)
-- ═══════════════════════════════════════════════════════════════════════

insert into public.events (
  id, title, code, organizer_id, department, category, description,
  location_type, venue, event_date, start_time, end_time, capacity, status
)
select * from (values
  (
    '11111111-1111-4111-8111-111111111101'::uuid,
    'Indigenous Knowledge Forum', 'IKF-2026-DEMO',
    'bb0c1d82-c0c2-492f-854c-735b749ec41c'::uuid,
    'Anthropology', 'Academic',
    'A half-day interdisciplinary forum bringing together students and faculty to explore the preservation, ethics, and academic integration of indigenous knowledge systems. Three keynote speakers confirmed.',
    'in-person'::text, 'Humanities Building, Rm 301',
    '2026-09-04'::date, '14:00'::time, '17:00'::time, 80, 'draft'::text
  ),
  (
    '11111111-1111-4111-8111-111111111102'::uuid,
    'Pre-Med Study Group — Week 8', 'PMS-2026-DEMO',
    '52a34c5d-615f-4e9c-9c44-c8e32874b3b3'::uuid,
    'Medical School', 'Academic',
    'Weekly structured study session for pre-med students. This is the eighth installment of a semester-long series. Attendance tracking and participation certificates requested for academic credit.',
    'in-person', 'Medical Sciences Library, Room 4',
    '2026-08-21', '18:00', '20:00', 25, 'draft'
  ),
  (
    '11111111-1111-4111-8111-111111111103'::uuid,
    'Computational Biology Bootcamp', 'CBB-2026-DEMO',
    'a911657c-cd64-46ba-bac4-dd504c24c640'::uuid,
    'Bioinformatics', 'Workshop',
    'Intensive one-day bootcamp covering sequence analysis, protein structure prediction, and data pipelines using Python. Additional workstations confirmed available for the requested capacity increase.',
    'in-person', 'Computer Science Lab 2',
    '2026-08-22', '09:00', '16:00', 40, 'draft'
  ),
  (
    '11111111-1111-4111-8111-111111111104'::uuid,
    'Environmental Policy Symposium', 'ENV-POL-2026-DEMO',
    'bb0c1d82-c0c2-492f-854c-735b749ec41c'::uuid,
    'Student Affairs', 'Academic',
    'Annual symposium on environmental policy featuring guest speakers from government and NGOs. Open to all students. Certificates of participation issued to all attendees.',
    'in-person', 'Whitman Hall, Rm 204',
    '2026-09-14', '09:00', '11:30', 100, 'published'
  ),
  (
    '11111111-1111-4111-8111-111111111105'::uuid,
    'Off-Campus Concert Series Night 3', 'OCS-2026-DEMO',
    '52a34c5d-615f-4e9c-9c44-c8e32874b3b3'::uuid,
    'Student Affairs', 'Social',
    'Third night of an ongoing concert series at an off-campus venue. Student performers and two external headlining acts.',
    'in-person', 'The Venue — 42 Market St',
    '2026-08-25', '21:00', '01:00', 300, 'draft'
  )
) as v
where not exists (select 1 from public.events where id = v.column1);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Demo approvals — 3 pending, 1 approved, 1 rejected
-- ═══════════════════════════════════════════════════════════════════════

insert into public.approvals (id, event_id, type, status, submitted_at, reviewed_by, resolved_at, rejection_reason)
select * from (values
  -- Pending
  (
    '22222222-2222-4222-8222-222222222201'::uuid,
    '11111111-1111-4111-8111-111111111101'::uuid,
    'new_event'::text, 'pending'::text,
    now() - interval '2 hours', null::uuid, null::timestamptz, null::text
  ),
  (
    '22222222-2222-4222-8222-222222222202'::uuid,
    '11111111-1111-4111-8111-111111111102'::uuid,
    'recurring', 'pending',
    now() - interval '4 hours', null, null, null
  ),
  (
    '22222222-2222-4222-8222-222222222203'::uuid,
    '11111111-1111-4111-8111-111111111103'::uuid,
    'capacity_change', 'pending',
    now() - interval '1 day', null, null, null
  ),
  -- Approved (event already published above)
  (
    '22222222-2222-4222-8222-222222222204'::uuid,
    '11111111-1111-4111-8111-111111111104'::uuid,
    'new_event', 'approved',
    now() - interval '9 days', '615e34a3-13f9-44ea-874f-c5b45d1b2a6c'::uuid, now() - interval '9 days' + interval '4 hours', null
  ),
  -- Rejected
  (
    '22222222-2222-4222-8222-222222222205'::uuid,
    '11111111-1111-4111-8111-111111111105'::uuid,
    'new_event', 'rejected',
    now() - interval '11 days', '615e34a3-13f9-44ea-874f-c5b45d1b2a6c'::uuid, now() - interval '10 days',
    'Off-campus events involving alcohol at non-university venues fall outside the scope of Fieldbook''s event management policy. Please coordinate directly with Student Life and resubmit if the event meets revised venue criteria.'
  )
) as v
where not exists (select 1 from public.approvals where id = v.column1);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Demo Platform Activity feed
-- ═══════════════════════════════════════════════════════════════════════

insert into public.platform_activity (id, category, message, accent_color, event_id, created_at)
select * from (values
  (
    '33333333-3333-4333-8333-333333333301'::uuid,
    'certificates_issued'::text,
    '142 certificates issued — Leadership Summit 2026'::text,
    '#2E6B4C'::text, null::uuid, now() - interval '1 hour'
  ),
  (
    '33333333-3333-4333-8333-333333333302'::uuid,
    'organizer_approved',
    'Dr. Marcus Webb approved as Organizer — Student Affairs',
    '#2E6B4C', null, now() - interval '2 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333303'::uuid,
    'event_rejected',
    'Off-Campus Concert Series Night 3 — rejected (off-venue policy)',
    '#B5432E', '11111111-1111-4111-8111-111111111105', now() - interval '10 days'
  ),
  (
    '33333333-3333-4333-8333-333333333304'::uuid,
    'new_registrations',
    '38 new student registrations across 4 events',
    '#1E1B16', null, now() - interval '5 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333305'::uuid,
    'template_updated',
    'Certificate template updated — Academic Lecture Series',
    '#1E1B16', null, now() - interval '1 day'
  ),
  (
    '33333333-3333-4333-8333-333333333306'::uuid,
    'event_approved',
    'Environmental Policy Symposium — approved and published',
    '#2E6B4C', '11111111-1111-4111-8111-111111111104', now() - interval '9 days'
  ),
  (
    '33333333-3333-4333-8333-333333333307'::uuid,
    'event_submitted',
    'Indigenous Knowledge Forum — submitted for approval',
    '#8A5C00', '11111111-1111-4111-8111-111111111101', now() - interval '2 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333308'::uuid,
    'upcoming_reminder',
    'Reminder: Environmental Policy Symposium is in 4 weeks — confirm venue AV setup',
    '#1E1B16', '11111111-1111-4111-8111-111111111104', now() - interval '3 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333309'::uuid,
    'certificate_delivery_failed',
    'Certificate delivery failed (2) — Design Thinking Workshop',
    '#B5432E', null, now() - interval '3 hours'
  ),
  (
    '3333333a-3333-4333-8333-33333333330a'::uuid,
    'event_submitted',
    'Computational Biology Bootcamp — capacity change requested',
    '#8A5C00', '11111111-1111-4111-8111-111111111103', now() - interval '1 day'
  )
) as v
where not exists (select 1 from public.platform_activity where id = v.column1);
