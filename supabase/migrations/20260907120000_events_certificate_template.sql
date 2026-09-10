-- Field Book — link events to a certificate template
--
-- Adds an optional per-event certificate template. Until now the `events`
-- table had no template linkage: the frontend carried a placeholder
-- `certTemplateId` (and, temporarily, a hardcoded test value) because there
-- was nowhere in the schema to record which template an event issues.
--
-- This column is the real linkage. It is nullable — an event with a null
-- value issues no certificate — and consumed by the frontend to pass
-- `templateId` to certificate-service when a student generates their
-- certificate for an attended event.
--
-- RLS: no policy change is needed. The existing events policies
-- (events_insert_organizer / events_update_own_organizer / *_admin) gate by
-- row ownership and status, not by column, so an organizer may already set
-- this column on their own event rows. The FK guarantees the value is a real
-- certificate_templates row; `on delete set null` clears the link rather than
-- cascading if a template is removed.

alter table public.events
  add column certificate_template_id uuid
    references public.certificate_templates(id) on delete set null;

create index idx_events_certificate_template
  on public.events (certificate_template_id);

comment on column public.events.certificate_template_id is
  'Optional certificate template issued to attendees of this event. Null = event issues no certificate. Consumed by the frontend to pass templateId to certificate-service.';
