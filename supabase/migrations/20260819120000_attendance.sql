-- Attendance table
-- Records when a student scans the event QR to mark their attendance.
-- Separate from registration: a student may register without attending,
-- or (depending on event settings) attend without prior registration.

create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  recorded_at timestamptz not null default now(),

  -- One attendance record per student per event
  constraint attendance_student_event_unique unique (student_id, event_id)
);

create index idx_attendance_student on public.attendance (student_id);
create index idx_attendance_event on public.attendance (event_id);

comment on table public.attendance is
  'Records student attendance at events. One row per student+event. Distinct from registration.';

-- RLS
alter table public.attendance enable row level security;

-- Students can insert their own attendance
create policy attendance_insert_own on public.attendance
  for insert to authenticated
  with check (student_id = auth.uid());

-- Students can read their own attendance records
create policy attendance_select_own on public.attendance
  for select to authenticated
  using (student_id = auth.uid());

-- Organizers and admins can read attendance for events they manage or all events
create policy attendance_select_organizer on public.attendance
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and e.organizer_id = auth.uid()
    )
  );

create policy attendance_select_admin on public.attendance
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
