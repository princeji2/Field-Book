-- Field Book — fix: missing SELECT policies on storage.objects
--
-- Bug: uploads to all three buckets (avatars, qr-photos,
-- certificate-templates) fail with "new row violates row-level security
-- policy", even for callers who satisfy that bucket's own INSERT policy.
--
-- Root cause: uploadToBucket() (src/lib/storage.ts) always uploads with
-- `upsert: true`, so the Storage API performs an
-- `INSERT ... ON CONFLICT (...) DO UPDATE` against storage.objects.
-- Evaluating that ON CONFLICT clause requires the row to be visible under
-- a SELECT check, in addition to the INSERT/UPDATE check — but
-- 20260816170000_storage_buckets.sql only ever added INSERT/UPDATE/DELETE
-- policies for these three buckets, never SELECT. With RLS enabled and no
-- SELECT policy, that visibility check fails, and Postgres reports it as
-- the same generic "new row violates row-level security policy" error —
-- indistinguishable from an actual INSERT/UPDATE policy failure without
-- reproducing it directly against the live project (done below).
--
-- Confirmed end-to-end against the live linked project: the exact same
-- upload (real signed-in user, real Storage HTTP API call, correct
-- object path) succeeds with `x-upsert` omitted and fails with it
-- present — isolating the missing SELECT policy as the actual cause, as
-- opposed to a path/prefix mismatch or a missing storage.buckets policy
-- (both ruled out separately). This is a pre-existing gap in
-- 20260816170000_storage_buckets.sql, not a regression from any
-- frontend change — storage.objects has zero rows in any of these three
-- buckets, meaning no upload has ever actually succeeded.
--
-- Fix: add the missing SELECT policy per bucket, using the exact same
-- scoping condition each bucket's INSERT policy already uses (own-uid
-- prefix for avatars, organizer-or-admin for qr-photos, admin-only for
-- certificate-templates) — this only grants visibility into the rows a
-- caller can already write, it does not broaden who can write.

create policy "avatars_bucket_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'));

create policy "qr_photos_bucket_select_organizer" on storage.objects
for select to authenticated
using (bucket_id = 'qr-photos' and (public.is_organizer() or public.is_admin()));

create policy "certificate_templates_bucket_select_admin" on storage.objects
for select to authenticated
using (bucket_id = 'certificate-templates' and public.is_admin());
