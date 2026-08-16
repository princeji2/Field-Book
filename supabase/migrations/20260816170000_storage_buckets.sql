-- Field Book — Storage buckets for real file uploads
--
-- Step 6 of docs/MIGRATION_GUIDE.md: certificate template backgrounds, QR
-- photos, and profile avatars currently live as base64 in React state and
-- localStorage (see admin/templates.tsx, organizer.tsx's OrgQRScreen, and
-- profile.tsx). This migration creates the three Storage buckets those
-- flows upload to; the frontend changes that swap base64/localStorage for
-- real uploads + a public-URL write live in a separate, non-SQL commit.
--
-- Bucket-to-column mapping (all three already exist as text columns):
--   certificate-templates -> certificate_templates.background_image_url
--   qr-photos             -> events.qr_photo_url
--   avatars                -> profiles.avatar_url
--
-- All three are public buckets, matching the existing `certificates`
-- bucket's documented pattern (certificate-service's README: "the
-- certificates bucket must exist and be public for the returned URLs to
-- be directly accessible"). Public here means anyone with the object's
-- URL can GET it — not that anyone can list/upload/overwrite. Write
-- access is still gated by the RLS policies below, scoped per bucket to
-- the same role logic already used for the underlying table (admins for
-- certificate templates, organizers for their own events' QR photos,
-- any authenticated user for their own avatar).
--
-- insert ... on conflict do nothing makes bucket creation idempotent —
-- safe to re-run this migration (or apply it after someone already
-- created one of these three buckets by hand) without erroring.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Buckets
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('certificate-templates', 'certificate-templates', true, 10485760,  -- 10 MB, matches admin/templates.tsx's client-side check
   array['image/png', 'image/jpeg', 'application/pdf']),
  ('qr-photos', 'qr-photos', true, 5242880,  -- 5 MB, matches organizer.tsx's client-side check
   array['image/png', 'image/jpeg']),
  ('avatars', 'avatars', true, 5242880,  -- 5 MB, matches profile.tsx's client-side check
   array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. storage.objects RLS policies
--
--    storage.objects already has RLS enabled by default on every Supabase
--    project (a platform-level default, not something this migration
--    turns on) — without policies below, authenticated users could still
--    read public-bucket objects (bucket-level `public = true` governs
--    anonymous/authenticated SELECT already) but could not write/update/
--    delete anything, which is the correct starting point. These policies
--    add the actual write access.
--
--    bucket_id scoping uses `(storage.foldername(name))[1]` nowhere here
--    deliberately — none of these three flows organizes uploads into
--    per-user subfolders today (filenames are flat within each bucket),
--    so policies below scope by bucket_id and role only, not by path.
-- ═══════════════════════════════════════════════════════════════════════

-- certificate-templates: only admins upload/replace/delete, matching
-- certificate_templates_insert_admin / update_admin / delete_admin.
create policy "certificate_templates_bucket_insert_admin" on storage.objects
for insert to authenticated
with check (bucket_id = 'certificate-templates' and public.is_admin());

create policy "certificate_templates_bucket_update_admin" on storage.objects
for update to authenticated
using (bucket_id = 'certificate-templates' and public.is_admin())
with check (bucket_id = 'certificate-templates' and public.is_admin());

create policy "certificate_templates_bucket_delete_admin" on storage.objects
for delete to authenticated
using (bucket_id = 'certificate-templates' and public.is_admin());

-- qr-photos: any organizer or admin can upload/replace/delete. Not scoped
-- to "only their own event's photo" at the storage layer — the app never
-- writes a per-organizer path (filenames are the event id, not
-- organizer-namespaced), and events_update_own_organizer on the events
-- table itself already prevents an organizer from attaching someone
-- else's uploaded photo to an event they don't own. This mirrors that
-- same organizer-or-admin boundary at the storage layer without
-- duplicating per-row ownership checks Storage objects can't express.
create policy "qr_photos_bucket_insert_organizer" on storage.objects
for insert to authenticated
with check (bucket_id = 'qr-photos' and (public.is_organizer() or public.is_admin()));

create policy "qr_photos_bucket_update_organizer" on storage.objects
for update to authenticated
using (bucket_id = 'qr-photos' and (public.is_organizer() or public.is_admin()))
with check (bucket_id = 'qr-photos' and (public.is_organizer() or public.is_admin()));

create policy "qr_photos_bucket_delete_organizer" on storage.objects
for delete to authenticated
using (bucket_id = 'qr-photos' and (public.is_organizer() or public.is_admin()));

-- avatars: any authenticated user can upload/replace/delete, but only
-- their own file — enforced by requiring the object name to start with
-- the caller's own uid, e.g. "<uid>-<timestamp>.png". This is the one
-- bucket where per-user scoping is enforceable at the storage layer
-- without a subfolder convention, since the frontend upload helper names
-- avatar files with the user's id as a prefix.
create policy "avatars_bucket_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'));

create policy "avatars_bucket_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'))
with check (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'));

create policy "avatars_bucket_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'));
