// Student-facing access to the `registrations` table (intent to attend).
//
// Distinct from lib/attendance.ts (actual QR check-in). Registration is
// capacity-bound and cancellable; attendance is append-only. Neither is a
// precondition for the other.
//
// Writes go through two SECURITY DEFINER / RLS-governed RPCs defined in
// supabase/migrations/20260820120000_registrations.sql:
//   register_for_event(p_event_id)  — capacity-safe (locks the event row)
//   cancel_registration(p_event_id) — flips the caller's row to 'cancelled'
// Reads are scoped by the registrations_select_own RLS policy
// (student_id = auth.uid()); an explicit .eq("student_id", ...) is also
// applied so a mismatched id can never surface someone else's rows.
//
// Event context (title/date/venue/code) is resolved via a PostgREST embed
// on the registrations.event_id -> events FK, normalized the same way as
// the attendance/certificate helpers (supabase-js types a to-one embed as
// an array).

import { supabase } from "./supabaseClient";
import { formatEventDate, formatEventTimeRange } from "./events";

// ─── Register ─────────────────────────────────────────────────────────────

export type RegisterResult =
  | { status: "success" }
  | { status: "full"; message: string }
  | { status: "error"; message: string };

/**
 * Registers the signed-in student for an event via the capacity-safe
 * register_for_event RPC. The RPC is idempotent (registering when already
 * registered is a no-op success) and reactivates a previously-cancelled
 * row. Maps the RPC's `event_full` error to a distinct "full" status so the
 * UI can show a specific message.
 */
export async function registerForEvent(eventId: string): Promise<RegisterResult> {
  const { error } = await supabase.rpc("register_for_event", { p_event_id: eventId });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("event_full")) {
      return { status: "full", message: "This event is full. No spots remaining." };
    }
    if (msg.includes("event_not_found")) {
      return { status: "error", message: "This event could not be found." };
    }
    if (msg.includes("not_authenticated")) {
      return { status: "error", message: "You must be signed in to register." };
    }
    return { status: "error", message: msg || "Couldn't register for this event." };
  }

  return { status: "success" };
}

// ─── Cancel ─────────────────────────────────────────────────────────────────

export type CancelRegistrationResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Cancels the signed-in student's registration for an event (status flip to
 * 'cancelled'). No-op if there is no active registration.
 */
export async function cancelRegistration(eventId: string): Promise<CancelRegistrationResult> {
  const { error } = await supabase.rpc("cancel_registration", { p_event_id: eventId });
  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

// ─── List my registrations ──────────────────────────────────────────────────

/**
 * A student's active registration, flattened from the `registrations` row
 * plus its embedded `events` context. Field names mirror the
 * MyRegisteredEvent shape the "Upcoming" tab / dashboard already render, so
 * the UI can consume this without a separate mapping layer.
 */
export interface RegisteredEvent {
  /** The event id (registrations.event_id). */
  id: string;
  title: string;
  category: string;
  /** Display-formatted event_date, e.g. "Nov 14, 2024". */
  date: string;
  /** Display-formatted start–end range, e.g. "9:00 AM – 11:30 AM". */
  time: string;
  venue: string;
  code: string;
  /** Raw event_date ("2024-11-14") for sorting / upcoming filtering. */
  eventDate: string | null;
  /** ISO timestamp the registration was made. */
  registeredAt: string;
}

export type ListMyRegistrationsResult =
  | { status: "success"; events: RegisteredEvent[] }
  | { status: "error"; message: string };

// supabase-js types a to-one FK embed as an array; model it as such and
// normalize to the first element (or null) at read time.
interface RegEmbeddedEvent {
  title: string | null;
  category: string | null;
  venue: string | null;
  code: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_type: string | null;
  status: string | null;
}

interface RegistrationJoinRow {
  event_id: string;
  registered_at: string;
  events: RegEmbeddedEvent | RegEmbeddedEvent[] | null;
}

function firstRegEmbed(
  events: RegEmbeddedEvent | RegEmbeddedEvent[] | null,
): RegEmbeddedEvent | null {
  if (!events) return null;
  return Array.isArray(events) ? (events[0] ?? null) : events;
}

/**
 * Lists the signed-in student's active ('registered') registrations, newest
 * first, with each event's title/date/time/venue/code resolved via the
 * events FK embed. Cancelled registrations are excluded.
 *
 * Only events that are still publicly visible come back with an embed
 * (events_select_public RLS covers published/live/completed); a registration
 * whose event is no longer visible falls back to generic labels rather than
 * being dropped.
 */
export async function listMyRegistrations(
  studentId: string,
): Promise<ListMyRegistrationsResult> {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "event_id, registered_at, events(title, category, venue, code, event_date, start_time, end_time, location_type, status)",
    )
    .eq("student_id", studentId)
    .eq("status", "registered")
    .order("registered_at", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const events: RegisteredEvent[] = ((data ?? []) as unknown as RegistrationJoinRow[]).map(
    (row) => {
      const ev = firstRegEmbed(row.events);
      return {
        id: row.event_id,
        title: ev?.title ?? "Fieldbook Event",
        category: ev?.category ?? "General",
        date: formatEventDate(ev?.event_date),
        time: formatEventTimeRange(ev?.start_time, ev?.end_time),
        venue: ev?.location_type === "online" ? "Online" : (ev?.venue ?? "Venue TBD"),
        code: ev?.code ?? "",
        eventDate: ev?.event_date ?? null,
        registeredAt: row.registered_at,
      };
    },
  );

  return { status: "success", events };
}

// ─── Active registration counts (for "spots left") ───────────────────────────

export type RegistrationCountsResult =
  | { status: "success"; counts: Map<string, number> }
  | { status: "error"; message: string };

/**
 * Returns a Map of event_id -> GLOBAL active ('registered') registration
 * count for the given event ids, used to compute "spots left"
 * (capacity - active).
 *
 * Uses the event_active_registration_counts SECURITY DEFINER RPC because a
 * student's registrations_select RLS only exposes their own rows — a plain
 * client query could not produce a global per-event count. The RPC returns
 * only aggregate integers (no student identity), scoped to the ids asked
 * for. Event ids with no active registrations simply aren't keys in the
 * returned map (callers treat missing as 0).
 */
export async function getActiveRegistrationCounts(
  eventIds: string[],
): Promise<RegistrationCountsResult> {
  const counts = new Map<string, number>();
  const ids = Array.from(new Set(eventIds.filter(Boolean)));
  if (ids.length === 0) return { status: "success", counts };

  const { data, error } = await supabase.rpc("event_active_registration_counts", {
    p_event_ids: ids,
  });

  if (error) return { status: "error", message: error.message };

  for (const row of (data ?? []) as { event_id: string; active_count: number }[]) {
    counts.set(row.event_id, Number(row.active_count));
  }
  return { status: "success", counts };
}
