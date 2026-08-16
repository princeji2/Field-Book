-- Field Book — certificate_url column on certificates
--
-- certificate-service's POST /api/certificates/generate renders the PDF,
-- uploads it to the certificates Storage bucket, and returns the resulting
-- public URL in its response body — but until now nothing persisted that
-- URL anywhere, matching the original comment on public.certificates
-- ("No certificate_url/storage-path column yet ... Add one if you want
-- issued certificates to be queryable by URL later").
--
-- That "later" is now: CertificateController inserts a row into this table
-- immediately after a successful Storage upload (service-role key,
-- server-side, same request), so a student's issued certificates can be
-- listed/re-fetched by URL instead of only ever returned once in the
-- original API response. This migration only adds the column; the insert
-- itself lives in certificate-service (CertificateController /
-- CertificateStorageService), not in a trigger or function here.
--
-- Nullable: existing rows (there are none yet in this fresh schema, but
-- the column addition itself doesn't assume any) and any future admin-only
-- manual correction path (certificates_update_admin) shouldn't be forced
-- to supply one.

alter table public.certificates
  add column certificate_url text;

comment on table public.certificates is
  'Issued certificate records. certificate_url is populated by certificate-service (service-role key) right after it uploads the generated PDF to Storage — no other write path sets it, per the certificates_insert_admin/update_admin-only RLS policies in 20260816120000_rls_policies.sql.';
