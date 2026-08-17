import { supabase } from "./supabaseClient";

// Real events-table access, shared between the organizer Events Workspace
// (create/list, scoped to the signed-in organizer) and the student
// Explore/Dashboard screens (public read, scoped by status). Both sides of
// Flow 1 — organizer creation and student visibility — go through this
// module so the RLS-facing query shapes live in exactly one place.

export type EventStatus = "draft" | "published" | "live" | "completed";
export type LocationType = "in-person" | "online" | "hybrid";

export interface EventRow {
  id: string;
  title: string;
  code: string;
  organizer_id: string | null;
  department: string | null;
  category: string | null;
  description: string | null;
  location_type: LocationType;
  venue: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  capacity: number;
  status: EventStatus;
  created_at?: string;
}

const EVENT_COLUMNS =
  "id, title, code, organizer_id, department, category, description, location_type, venue, event_date, start_time, end_time, capacity, status, created_at";

export type ListEventsResult =
  | { status: "success"; events: EventRow[] }
  | { status: "error"; message: string };

/**
 * Lists events visible to any signed-in user per the events_select_public
 * RLS policy — status in ('published','live','completed'). Used by the
 * student Explore/Dashboard screens.
 *
 * No capacity/spots-remaining figure is computed here: there is no
 * registrations/attendees table yet (see the note in student.tsx's
 * MyEventsScreen), so callers get the event's total `capacity` and decide
 * how to present it — currently shown as-is rather than as "spots left",
 * since nothing has actually claimed a seat yet.
 */
export async function listPublicEvents(): Promise<ListEventsResult> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("status", ["published", "live", "completed"])
    .order("event_date", { ascending: true });

  if (error) return { status: "error", message: error.message };
  return { status: "success", events: (data ?? []) as EventRow[] };
}

/**
 * Lists every event owned by the given organizer, any status (draft
 * included), per the events_select_own_organizer RLS policy. Used by the
 * organizer Events Workspace list.
 */
export async function listOrganizerEvents(organizerId: string): Promise<ListEventsResult> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });

  if (error) return { status: "error", message: error.message };
  return { status: "success", events: (data ?? []) as EventRow[] };
}

export type GetEventResult =
  | { status: "success"; event: EventRow }
  | { status: "error"; message: string };

/**
 * Fetches a single event by id. Relies entirely on RLS to decide whether
 * the row is visible to the caller (events_select_public /
 * events_select_own_organizer / events_select_admin) — a student
 * requesting a draft event they can't see gets the same "not found" shape
 * as a genuinely missing id, by design (no policy details leak here).
 */
export async function getEventById(id: string): Promise<GetEventResult> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Event not found." };
  }
  return { status: "success", event: data as EventRow };
}

/**
 * Looks up display names for a set of organizer ids via the
 * organizer_directory view (id, full_name, avatar_url only — never
 * email/phone/bio; see 20260816120000_rls_policies.sql). Ids with no
 * non-draft events (and therefore absent from that view) simply aren't in
 * the returned map — callers should fall back to a generic label.
 */
export async function fetchOrganizerNames(organizerIds: string[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(organizerIds.filter((id): id is string => !!id)));
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data, error } = await supabase
    .from("organizer_directory")
    .select("id, full_name")
    .in("id", ids);

  if (error || !data) return map;
  for (const row of data as { id: string; full_name: string }[]) {
    map.set(row.id, row.full_name);
  }
  return map;
}

/** Generates a unique-ish, human-readable event code, e.g. "ENV-POL-2026-A1B2". */
export function generateEventCode(title: string): string {
  const slug =
    title
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .split("-")
      .filter(Boolean)
      .slice(0, 2)
      .join("-") || "EVT";
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug}-${year}-${suffix}`;
}

/** Formats an `event_date` ("2024-11-14") as "Nov 14, 2024". Falls back to the raw string if unparsable. */
export function formatEventDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Date TBD";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Formats a `time` column value ("14:30:00" or "14:30") as "2:30 PM". Undefined if unset/unparsable. */
export function formatEventTime(t: string | null | undefined): string | undefined {
  if (!t) return undefined;
  const [hh, mm] = t.split(":");
  const h = parseInt(hh, 10);
  if (Number.isNaN(h) || mm === undefined) return undefined;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

/** Formats a start/end time pair as "9:00 AM – 11:30 AM", a single time, or "Time TBD". */
export function formatEventTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = formatEventTime(start);
  const e = formatEventTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return "Time TBD";
}

/** Capitalizes a DB status value for display, e.g. "published" -> "Published". */
export function capitalizeStatus(status: EventStatus): "Draft" | "Published" | "Live" | "Completed" {
  if (status === "published") return "Published";
  if (status === "live") return "Live";
  if (status === "completed") return "Completed";
  return "Draft";
}
