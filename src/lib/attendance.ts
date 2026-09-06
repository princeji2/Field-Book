import { supabase } from "./supabaseClient";
import { formatEventDate, formatEventTimeRange } from "./events";

/**
 * Attendance recording service.
 *
 * Records student attendance at events via the `attendance` table.
 * Separate from registration — attendance is the act of scanning the
 * event QR or entering its code during the session window.
 */

export type RecordAttendanceResult =
  | { status: "success"; recordedAt: string }
  | { status: "duplicate"; message: string }
  | { status: "error"; message: string };

/**
 * Records attendance for the given student at the given event.
 *
 * Returns "duplicate" if the student already has an attendance record
 * for this event (the unique constraint on student_id+event_id prevents
 * double-inserts at the DB level). Returns "success" with the recorded
 * timestamp on a fresh insert.
 */
export async function recordAttendance(
  studentId: string,
  eventId: string,
): Promise<RecordAttendanceResult> {
  const { data, error } = await supabase
    .from("attendance")
    .insert({ student_id: studentId, event_id: eventId })
    .select("recorded_at")
    .single();

  if (error) {
    // Postgres unique_violation code = 23505
    if (error.code === "23505") {
      return { status: "duplicate", message: "Attendance already recorded for this event." };
    }
    return { status: "error", message: error.message };
  }

  return { status: "success", recordedAt: data.recorded_at as string };
}

export type CheckAttendanceResult =
  | { status: "attended"; recordedAt: string }
  | { status: "not_attended" }
  | { status: "error"; message: string };

/**
 * Checks whether the given student already has an attendance record
 * for the given event. Useful for showing "already attended" state
 * before attempting a scan.
 */
export async function checkAttendance(
  studentId: string,
  eventId: string,
): Promise<CheckAttendanceResult> {
  const { data, error } = await supabase
    .from("attendance")
    .select("recorded_at")
    .eq("student_id", studentId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (data) {
    return { status: "attended", recordedAt: data.recorded_at as string };
  }

  return { status: "not_attended" };
}

/**
 * A single attended event, flattened from an `attendance` row plus its
 * embedded `events` context. Field names mirror the MyRegisteredEvent
 * shape the "Past" tab of the My Events screen already renders (title,
 * category, date, time, venue, code), so the UI can consume this without a
 * separate mapping layer. `attended` is always true here — this list is
 * derived from real attendance records, so every entry is, by definition,
 * an event the student attended.
 */
export interface AttendedEvent {
  /** The event id (attendance.event_id). */
  id: string;
  title: string;
  category: string;
  /** Display-formatted event_date, e.g. "Nov 14, 2024". */
  date: string;
  /** Display-formatted start–end range, e.g. "9:00 AM – 11:30 AM". */
  time: string;
  venue: string;
  code: string;
  /** ISO timestamp the attendance was recorded (attendance.recorded_at). */
  recordedAt: string;
  attended: true;
}

export type ListMyAttendanceResult =
  | { status: "success"; events: AttendedEvent[] }
  | { status: "error"; message: string };

// Shape of the embedded events row returned by the PostgREST join.
// supabase-js types a foreign-table embed as an array even for a to-one
// relationship, so it's modelled here as an array and normalized to the
// first element (or null) at read time.
interface AttendanceEmbeddedEvent {
  title: string | null;
  category: string | null;
  venue: string | null;
  code: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_type: string | null;
}

interface AttendanceJoinRow {
  event_id: string;
  recorded_at: string;
  events: AttendanceEmbeddedEvent | AttendanceEmbeddedEvent[] | null;
}

function firstAttendanceEmbed(
  events: AttendanceEmbeddedEvent | AttendanceEmbeddedEvent[] | null,
): AttendanceEmbeddedEvent | null {
  if (!events) return null;
  return Array.isArray(events) ? (events[0] ?? null) : events;
}

/**
 * Lists every event the signed-in student has an attendance record for,
 * newest first, with each event's title/date/time/venue/code resolved in
 * the same query via the events FK embed.
 *
 * Scoped by the `attendance_select_own` RLS policy
 * (student_id = auth.uid()); an explicit `.eq("student_id", studentId)` is
 * also applied so the query is correct and cheap regardless, and can never
 * surface another student's rows. Rows whose linked event is not visible
 * (e.g. deleted) come back with a null embed and fall back to generic
 * labels rather than being dropped.
 */
export async function listMyAttendance(
  studentId: string,
): Promise<ListMyAttendanceResult> {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      "event_id, recorded_at, events(title, category, venue, code, event_date, start_time, end_time, location_type)",
    )
    .eq("student_id", studentId)
    .order("recorded_at", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const events: AttendedEvent[] = ((data ?? []) as unknown as AttendanceJoinRow[]).map((row) => {
    const ev = firstAttendanceEmbed(row.events);
    return {
      id: row.event_id,
      title: ev?.title ?? "Fieldbook Event",
      category: ev?.category ?? "General",
      date: formatEventDate(ev?.event_date),
      time: formatEventTimeRange(ev?.start_time, ev?.end_time),
      venue: ev?.location_type === "online" ? "Online" : (ev?.venue ?? "Venue TBD"),
      code: ev?.code ?? "",
      recordedAt: row.recorded_at,
      attended: true,
    };
  });

  return { status: "success", events };
}

// ─── Organizer attendee roster ──────────────────────────────────────────────

/**
 * A single attendee of one organizer-owned event, as returned by the
 * `event_attendees(p_event_id)` RPC (20260822120000_event_attendees_rpc.sql).
 *
 * The RPC unions active registrations, attendance records, and issued
 * certificates for the event and resolves each student's name server-side
 * (organizers have no direct `profiles` read path). It exposes ONLY the
 * fields below — no email/phone/bio — and returns zero rows unless the
 * caller owns the event.
 */
export interface EventAttendee {
  /** The student's profiles.id. */
  studentId: string;
  /** Student display name (profiles.full_name). */
  fullName: string;
  /** Has an active ('registered') registration for the event. */
  registered: boolean;
  /** Has an attendance (check-in) record for the event. */
  checkedIn: boolean;
  /** ISO timestamp of the check-in, or null if not checked in. */
  checkedInAt: string | null;
  /** At least one certificate has been issued to the student for this event. */
  certificateIssued: boolean;
}

// Row shape as it comes back from the RPC (snake_case columns).
interface EventAttendeeRpcRow {
  student_id: string;
  full_name: string | null;
  registered: boolean | null;
  checked_in: boolean | null;
  checked_in_at: string | null;
  certificate_issued: boolean | null;
}

export type ListEventAttendeesResult =
  | { status: "success"; attendees: EventAttendee[] }
  | { status: "error"; message: string };

/**
 * Lists the attendee roster for a single event the signed-in organizer
 * owns, via the `event_attendees` RPC. Ordering (from the RPC): checked-in
 * students first by check-in time, then the rest by name.
 *
 * Authorization is enforced entirely server-side inside the SECURITY
 * DEFINER function (events.organizer_id = auth.uid()); a non-owner — or a
 * guest — simply gets an empty list, never another organizer's roster.
 */
export async function listEventAttendees(
  eventId: string,
): Promise<ListEventAttendeesResult> {
  const { data, error } = await supabase.rpc("event_attendees", {
    p_event_id: eventId,
  });

  if (error) return { status: "error", message: error.message };

  const attendees: EventAttendee[] = ((data ?? []) as EventAttendeeRpcRow[]).map((row) => ({
    studentId: row.student_id,
    fullName: row.full_name ?? "Fieldbook Student",
    registered: row.registered ?? false,
    checkedIn: row.checked_in ?? false,
    checkedInAt: row.checked_in_at ?? null,
    certificateIssued: row.certificate_issued ?? false,
  }));

  return { status: "success", attendees };
}
