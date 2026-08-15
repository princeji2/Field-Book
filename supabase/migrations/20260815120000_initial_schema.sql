-- Field Book — initial schema
--
-- IMPORTANT CONTEXT: this repo has no prisma/schema.prisma, no SQLite database,
-- and no prior migration of any kind — confirmed by an exhaustive search of the
-- repository. This is a fresh-schema migration for a brand new, empty Supabase
-- Postgres project, NOT a port of an existing database.
--
-- Source of truth used to derive this schema (in order of authority):
--   1. certificate-service's Java model classes (CertificateTemplate.java,
--      TemplateField.java) and SupabaseClient.java, which already hard-code
--      the certificate_templates column names it queries. This migration MUST
--      match those exactly or the service breaks.
--   2. docs/MIGRATION_GUIDE.md Step 4, the only place in the repo that names
--      six tables and their intended columns.
--   3. The frontend's actual (mock) TypeScript types, which encode what the
--      app expects a row to look like in practice. These types are NOT
--      consistent with each other or with the migration guide — every screen
--      defines its own local shape for "the same" entity. Columns pulled from
--      here rather than the guide are called out below.
--
-- This migration creates tables and indexes only. Row-Level Security is
-- enabled on every table with NO policies attached (see the note at the
-- bottom) — that is intentionally a separate step, matching the migration
-- guide's own Step 5.

-- ─────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────

-- gen_random_uuid() lives in pgcrypto. Supabase ships this enabled by
-- default, but declaring it explicitly keeps the migration portable and
-- idempotent to (re)apply.
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
--   1:1 with Supabase auth.users. Columns per migration guide (full_name,
--   email, phone, bio, avatar_url, role, member_since).
-- ─────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null unique,
  phone        text,
  bio          text,
  avatar_url   text,
  -- Exact role strings confirmed in src/app/admin/shell.tsx and profile.tsx
  -- are capitalized ("Student"/"Organizer"/"Admin"). Stored lowercase here
  -- per Postgres/Supabase convention — the app's presentation layer is
  -- expected to capitalize for display. See note below.
  role         text not null check (role in ('student', 'organizer', 'admin')),
  member_since timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);

comment on table public.profiles is
  'Extends auth.users with app-specific profile data. Row id == auth.users.id.';

-- ─────────────────────────────────────────────────────────────────────────
-- events
--   Reconciles FOUR inconsistent frontend shapes (OrgEvent, EventFormData,
--   EventItem, MyRegisteredEvent) into one canonical table. See the
--   accompanying explanation for the mapping.
-- ─────────────────────────────────────────────────────────────────────────

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  -- Human-readable event code, e.g. "ENV-POL-2024" (src/app/student.tsx
  -- EventItem.code). Not in the migration guide's column list, but the
  -- frontend keys certificates and QR generation off of it.
  code          text not null unique,
  organizer_id  uuid references public.profiles(id) on delete set null,
  department    text,
  category      text,
  description   text,
  location_type text not null default 'in-person'
                  check (location_type in ('in-person', 'online', 'hybrid')),
  venue         text,
  event_date    date not null,
  start_time    time,
  end_time      time,
  capacity      integer not null default 0 check (capacity >= 0),
  -- OrgEvent.status values, lowercased: Draft/Published/Live/Completed.
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'live', 'completed')),
  -- Named in docs/MIGRATION_GUIDE.md Step 6 (events.qr_photo_url) even
  -- though no such field exists in the current frontend types — the QR is
  -- currently generated client-side from `code`. Column included so the
  -- storage step described in the guide has somewhere to write to; may end
  -- up unused if that flow isn't built as described.
  qr_photo_url  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_events_organizer on public.events (organizer_id);
create index idx_events_status on public.events (status);
create index idx_events_date on public.events (event_date);

comment on table public.events is
  'Canonical event record. Reconciles OrgEvent/EventFormData/EventItem/MyRegisteredEvent from the frontend prototype.';

-- ─────────────────────────────────────────────────────────────────────────
-- approvals
--   Base columns per migration guide. `type` and `resolved_at` added
--   because src/app/admin/approvals.tsx's Approval type confirms both exist
--   and are populated in practice, even though the guide's column list
--   doesn't mention them.
-- ─────────────────────────────────────────────────────────────────────────

create table public.approvals (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  -- Confirmed in admin/approvals.tsx Approval.type; not in the guide's list.
  type             text not null default 'new_event'
                     check (type in ('new_event', 'recurring', 'capacity_change', 'edit')),
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  submitted_at     timestamptz not null default now(),
  reviewed_by      uuid references public.profiles(id) on delete set null,
  -- Confirmed present (optional) in admin/approvals.tsx Approval.resolvedAt;
  -- not in the guide's list.
  resolved_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now()
);

create index idx_approvals_event on public.approvals (event_id);
create index idx_approvals_status on public.approvals (status);
create index idx_approvals_reviewed_by on public.approvals (reviewed_by);

comment on table public.approvals is
  'Approval workflow state for an event. reviewed_by is not yet populated by the current frontend prototype.';

-- ─────────────────────────────────────────────────────────────────────────
-- certificate_templates
--   MUST match certificate-service's Java model exactly:
--   CertificateTemplate.java expects background_image_url, aspect_ratio,
--   fields (jsonb array); TemplateField.java expects each fields[] element
--   to look like { id, enabled, fontFamily, size, x, y, ... }.
-- ─────────────────────────────────────────────────────────────────────────

create table public.certificate_templates (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  accent              text,
  is_default          boolean not null default false,
  usage_count         integer not null default 0,
  -- Required by certificate-service's CertificatePdfService: the base image
  -- it stamps studentName/eventTitle/certificateCode onto.
  background_image_url text,
  -- width / height, e.g. 1.4142 for A4 landscape. Nullable — the service
  -- falls back to 1.4142 if this is null.
  aspect_ratio        double precision,
  -- Array of { id, enabled, fontFamily, size, x, y, ... } — see
  -- TemplateField.java. The check constraint only enforces "is a JSON
  -- array"; per-object shape is validated by the Java service at read time,
  -- not by Postgres.
  fields              jsonb not null default '[]'::jsonb
                        check (jsonb_typeof(fields) = 'array'),
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_certificate_templates_created_by on public.certificate_templates (created_by);

comment on table public.certificate_templates is
  'Certificate layout templates. Column names/types are consumed directly by certificate-service via PostgREST — do not rename without updating that service.';

-- ─────────────────────────────────────────────────────────────────────────
-- certificates
--   Base columns per migration guide. event_id/student_id/template_id are
--   nullable: the frontend's own CertRecord mock data already has an empty
--   eventId in places, and template_id has no linkage in the prototype at
--   all yet — nullability mirrors that documented looseness rather than
--   forcing a stricter model the app doesn't populate today.
-- ─────────────────────────────────────────────────────────────────────────

create table public.certificates (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid references public.events(id) on delete set null,
  student_id        uuid references public.profiles(id) on delete set null,
  template_id       uuid references public.certificate_templates(id) on delete set null,
  -- Format observed in student.tsx mock data: "CERT-FB-2024-088021".
  certificate_code  text not null unique,
  issued_at         timestamptz not null default now()
);

create index idx_certificates_event on public.certificates (event_id);
create index idx_certificates_student on public.certificates (student_id);
create index idx_certificates_template on public.certificates (template_id);

comment on table public.certificates is
  'Issued certificate records. No certificate_url/storage-path column yet — certificate-service currently returns the Storage URL directly in its API response rather than persisting it here. Add one if you want issued certificates to be queryable by URL later.';

-- ─────────────────────────────────────────────────────────────────────────
-- notifications
--   Base columns per migration guide. The frontend actually has two
--   richer, inconsistent shapes (AdminNotifItem with title+body+category,
--   NotifItem with a single text field) — this table implements the
--   guide's minimal (message, read, created_at) shape rather than either
--   frontend variant. See explanation for why.
-- ─────────────────────────────────────────────────────────────────────────

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id);
create index idx_notifications_unread on public.notifications (user_id) where read = false;

comment on table public.notifications is
  'Per-user notifications. Frontend mock types have richer shapes (category, title/body) not represented here — see migration explanation.';

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger trg_certificate_templates_updated_at
  before update on public.certificate_templates
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row-Level Security — ENABLED, NO POLICIES YET
--
-- This intentionally matches docs/MIGRATION_GUIDE.md, which treats RLS
-- policy design as a separate step (Step 5) after schema creation (Step 4).
--
-- Effect of enabling RLS with zero policies: the anon and authenticated
-- Supabase client keys get ZERO rows and permission-denied on writes for
-- every table below, full stop, until real policies are added. This is the
-- safe default — it prevents these tables from being publicly readable the
-- moment they're created.
--
-- certificate-service is unaffected: it authenticates with the service-role
-- key, which bypasses RLS entirely by design.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.approvals enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificates enable row level security;
alter table public.notifications enable row level security;
