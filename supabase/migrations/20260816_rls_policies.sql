-- Field Book — Row Level Security policies
--
-- Applies on top of 20260815120000_initial_schema.sql, which already
-- enabled RLS on all six tables with zero policies attached (meaning,
-- until this migration runs, anon/authenticated get zero rows and
-- permission-denied on every write, everywhere). This migration adds the
-- actual policies.
--
-- certificate-service is unaffected by anything below: it authenticates
-- with the Supabase service-role key, which bypasses RLS entirely by
-- design, regardless of what policies exist on any table.
--
-- Policy count per table, for sanity-checking against what we discussed:
--
--   profiles                6 policies  (select_own, select_admin,
--                                         insert_own, update_own,
--                                         update_admin, delete_admin)
--   events                  9 policies  (select_public,
--                                         select_own_organizer,
--                                         select_admin, insert_organizer,
--                                         insert_admin,
--                                         update_own_organizer,
--                                         update_admin, delete_own_draft,
--                                         delete_admin)
--   approvals               6 policies  (select_own_organizer,
--                                         select_admin,
--                                         insert_own_organizer,
--                                         insert_admin, update_admin,
--                                         delete_admin)
--   certificate_templates   4 policies  (select_staff, insert_admin,
--                                         update_admin, delete_admin)
--   certificates            6 policies  (select_own_student,
--                                         select_own_organizer,
--                                         select_admin, insert_admin,
--                                         update_admin, delete_admin)
--   notifications           6 policies  (select_own, select_admin,
--                                         update_own, insert_admin,
--                                         delete_own, delete_admin)
--   ─────────────────────────────────────
--   TOTAL                   37 policies across 6 tables
--
-- Plus 3 helper functions (current_profile_role, is_admin, is_organizer)
-- and 2 supplementary views (organizer_directory,
-- event_certificate_recipients) that expose only non-sensitive profile
-- columns (id, full_name, avatar_url) to authenticated users who need to
-- see an organizer's or student's name without getting email/phone/bio.
--
-- Every policy below is scoped `to authenticated`. None apply to `anon` —
-- there is no unauthenticated/public/guest read or write access anywhere
-- in this file.
--
-- Known tradeoff (not fixed here): several tables stack multiple
-- permissive policies on the same command (e.g. events SELECT has
-- events_select_public + events_select_own_organizer + events_select_admin;
-- similarly for profiles/approvals/certificates/notifications SELECT, and
-- events INSERT/UPDATE/DELETE). Postgres ORs all applicable permissive
-- policies together per command, so this is correct but costs an extra
-- qual evaluation per stacked policy per row — Supabase's advisor will
-- likely flag this as "multiple_permissive_policies" (performance, not
-- security). Left as separate self-scope + admin-override policies for
-- readability rather than consolidated with OR into one policy per
-- command. Revisit if the advisor flags it as a real bottleneck once
-- there's production data volume.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Helper functions
--    Must exist before any policy below references them.
-- ═══════════════════════════════════════════════════════════════════════

-- Returns the calling user's role by reading their own profiles row.
-- SECURITY DEFINER so this internal lookup bypasses RLS (it runs as the
-- function owner, which has BYPASSRLS) instead of recursively
-- re-evaluating profiles' own SELECT policies. Only ever returns a single
-- scalar for the caller's own id — cannot be used to read anyone else's
-- data.
create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_profile_role() = 'admin';
$$;

create or replace function public.is_organizer()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_profile_role() = 'organizer';
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organizer() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. profiles (6 policies)
-- ═══════════════════════════════════════════════════════════════════════

-- Every user can read their own full profile row (email/phone/bio
-- included — this is the only self-service path to those fields).
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

-- Admins can read every profile (user management screen).
create policy "profiles_select_admin" on public.profiles
for select to authenticated
using (public.is_admin());

-- A user may create their own profile row at sign-up, but cannot
-- self-assign the admin role — only student/organizer.
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (
  auth.uid() = id
  and role in ('student', 'organizer')
);

-- Self can update their own profile, but cannot change their own role.
-- Uses the current_profile_role() helper (SECURITY DEFINER) instead of a
-- raw self-referential subquery against profiles, so this doesn't
-- re-evaluate profiles' own RLS policies from inside one of its policies.
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = public.current_profile_role()
);

-- Admins can update any profile, including role changes (Edit Role modal).
create policy "profiles_update_admin" on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admins can delete a profile row. Prefer real user removal/ban via the
-- Supabase Auth admin API (service role) over this where possible — this
-- only removes the profiles row, not the underlying auth.users row.
create policy "profiles_delete_admin" on public.profiles
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 3. events (9 policies)
-- ═══════════════════════════════════════════════════════════════════════

-- Anyone signed in can browse events that are actually public-facing.
create policy "events_select_public" on public.events
for select to authenticated
using (status in ('published', 'live', 'completed'));

-- Organizers can always see their own events, drafts included.
create policy "events_select_own_organizer" on public.events
for select to authenticated
using (organizer_id = auth.uid());

-- Admins can see every event regardless of status.
create policy "events_select_admin" on public.events
for select to authenticated
using (public.is_admin());

-- Organizers can create events, only as themselves, starting as drafts —
-- matches the approvals-table workflow: new events go through review
-- before becoming published/live.
create policy "events_insert_organizer" on public.events
for insert to authenticated
with check (
  public.is_organizer()
  and organizer_id = auth.uid()
  and status = 'draft'
);

-- Admins can create events on anyone's behalf, any status.
create policy "events_insert_admin" on public.events
for insert to authenticated
with check (public.is_admin());

-- Organizers can edit their own events.
create policy "events_update_own_organizer" on public.events
for update to authenticated
using (organizer_id = auth.uid())
with check (organizer_id = auth.uid());

-- Admins can edit any event (approval-driven status changes, corrections).
create policy "events_update_admin" on public.events
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Organizers may delete their own events only while still a draft — once
-- published/live/completed, deletion is admin-only to avoid an organizer
-- yanking an event students have already registered/certified against.
create policy "events_delete_own_draft" on public.events
for delete to authenticated
using (organizer_id = auth.uid() and status = 'draft');

-- Admins can delete any event.
create policy "events_delete_admin" on public.events
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 4. approvals (6 policies)
-- ═══════════════════════════════════════════════════════════════════════

-- Organizers can see approval records for events they own.
create policy "approvals_select_own_organizer" on public.approvals
for select to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = approvals.event_id and e.organizer_id = auth.uid()
  )
);

-- Admins can see every approval record, regardless of event ownership.
create policy "approvals_select_admin" on public.approvals
for select to authenticated
using (public.is_admin());

-- An organizer can submit an approval request, only for an event they own.
create policy "approvals_insert_own_organizer" on public.approvals
for insert to authenticated
with check (
  exists (
    select 1 from public.events e
    where e.id = approvals.event_id and e.organizer_id = auth.uid()
  )
);

-- Admins can also create approval records directly (e.g. logging a
-- retroactive/manual review).
create policy "approvals_insert_admin" on public.approvals
for insert to authenticated
with check (public.is_admin());

-- Only admins resolve approvals (approve/reject/rejection_reason).
-- Organizers get no update policy at all — they cannot self-approve or
-- edit the outcome of their own request.
create policy "approvals_update_admin" on public.approvals
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Only admins can delete approval records (audit cleanup).
create policy "approvals_delete_admin" on public.approvals
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 5. certificate_templates (4 policies)
-- ═══════════════════════════════════════════════════════════════════════

-- Admins and organizers can list/view templates. Organizer read access is
-- forward-looking for the not-yet-built template picker in organizer.tsx
-- (currently stubbed "coming soon") — it has no effect on
-- certificate-service, which uses the service-role key regardless.
create policy "certificate_templates_select_staff" on public.certificate_templates
for select to authenticated
using (public.is_admin() or public.is_organizer());

-- Only admins create templates (matches admin/templates.tsx, the only
-- template-management screen in the app today).
create policy "certificate_templates_insert_admin" on public.certificate_templates
for insert to authenticated
with check (public.is_admin());

-- Only admins edit templates.
create policy "certificate_templates_update_admin" on public.certificate_templates
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Only admins delete templates.
create policy "certificate_templates_delete_admin" on public.certificate_templates
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 6. certificates (6 policies)
--    No organizer/student INSERT policy exists anywhere in this table:
--    real issuance runs through certificate-service's service-role key
--    (PDF rendering, storage upload, certificate_code generation), which
--    bypasses RLS regardless of what's defined here. A bare client-side
--    insert would create a certificates row with no matching PDF/storage
--    artifact, so that path is intentionally absent.
-- ═══════════════════════════════════════════════════════════════════════

-- A student can see their own issued certificates.
create policy "certificates_select_own_student" on public.certificates
for select to authenticated
using (student_id = auth.uid());

-- An organizer can see certificates tied to events they own.
create policy "certificates_select_own_organizer" on public.certificates
for select to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = certificates.event_id and e.organizer_id = auth.uid()
  )
);

-- Admins can see every certificate.
create policy "certificates_select_admin" on public.certificates
for select to authenticated
using (public.is_admin());

-- Admin-only manual correction path (e.g. fixing a bad record without
-- going through certificate-service). Deliberately narrow — not a
-- parallel issuance path.
create policy "certificates_insert_admin" on public.certificates
for insert to authenticated
with check (public.is_admin());

-- Admin-only manual correction (e.g. re-linking a certificate to the
-- correct template_id or student_id after a data-entry error).
create policy "certificates_update_admin" on public.certificates
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin-only revocation/deletion.
create policy "certificates_delete_admin" on public.certificates
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 7. notifications (6 policies)
-- ═══════════════════════════════════════════════════════════════════════

-- A user can always see their own notifications.
create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

-- Admins can see every user's notifications (oversight/support/moderation).
create policy "notifications_select_admin" on public.notifications
for select to authenticated
using (public.is_admin());

-- A user can update their own notification (e.g. mark as read). Admins do
-- NOT get an update policy on other users' notifications — marking
-- someone else's notification "read" on their behalf has no legitimate
-- use case in this app.
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Admins can insert notifications for any user (system/management
-- broadcasts — e.g. "your account was suspended"). Regular cross-user
-- notifications triggered by app events (approval decisions, cert
-- issuance) should come from a SECURITY DEFINER trigger/function, which
-- bypasses RLS by design, rather than a client-side policy for
-- organizer/student. No non-admin INSERT policy exists on this table.
create policy "notifications_insert_admin" on public.notifications
for insert to authenticated
with check (public.is_admin());

-- A user can delete/dismiss their own notifications.
create policy "notifications_delete_own" on public.notifications
for delete to authenticated
using (user_id = auth.uid());

-- Admins can delete any notification (moderation/cleanup).
create policy "notifications_delete_admin" on public.notifications
for delete to authenticated
using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- 8. Supplementary views — non-sensitive fields only
--    These exist so the frontend can show an organizer's or student's
--    name in a context where the base `profiles` policies correctly
--    withhold the full row (email/phone/bio). Both views select only
--    id, full_name, avatar_url — never email/phone/bio — so there is
--    nothing sensitive to leak regardless of how a client queries them.
--    Granted to `authenticated` only; explicitly revoked from `anon`.
-- ═══════════════════════════════════════════════════════════════════════

-- Organizer name + avatar, for any organizer with at least one non-draft
-- event — used by student-facing event detail/browse screens
-- (EventDetailScreen renders ev.organizer's name today from mock data;
-- this view is the real-data equivalent).
create view public.organizer_directory as
select distinct p.id, p.full_name, p.avatar_url
from public.profiles p
join public.events e on e.organizer_id = p.id
where e.status in ('published', 'live', 'completed');

grant select on public.organizer_directory to authenticated;
revoke all on public.organizer_directory from anon;

-- Student name, scoped to certificates tied to *the calling organizer's
-- own* events (used by OrgAttendeesScreen/OrgCertificatesScreen-style
-- rosters). auth.uid() is evaluated per actual caller, so this stays
-- self-scoped to the querying organizer even though the view itself
-- bypasses profiles' RLS internally.
create view public.event_certificate_recipients as
select p.id, p.full_name, c.event_id
from public.profiles p
join public.certificates c on c.student_id = p.id
join public.events e on e.id = c.event_id
where e.organizer_id = auth.uid();

grant select on public.event_certificate_recipients to authenticated;
revoke all on public.event_certificate_recipients from anon;
