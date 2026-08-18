import { supabase } from "./supabaseClient";

// Real reads/writes against the `platform_activity` table
// (supabase/migrations/20260819100000_platform_activity.sql) — backs the
// Admin Dashboard's "Platform Activity" panel. Display-only: nothing in
// the app reads this table to drive business logic, unlike `approvals`.
// Seeded with realistic demo rows at migration time
// (20260819110000_seed_demo_data.sql); real admin actions
// (approveEventApproval/rejectEventApproval in approvals.ts) append more
// rows here over time via logActivity() below.

export type ActivityCategory =
  | "certificates_issued"
  | "organizer_approved"
  | "new_registrations"
  | "template_updated"
  | "event_submitted"
  | "event_approved"
  | "event_rejected"
  | "upcoming_reminder"
  | "certificate_delivery_failed";

export interface PlatformActivityItem {
  id: string;
  category: ActivityCategory | string;
  message: string;
  accentColor: string;
  eventId: string | null;
  actorId: string | null;
  createdAt: string;
}

export type ListActivityResult =
  | { status: "success"; items: PlatformActivityItem[] }
  | { status: "error"; message: string };

/**
 * Lists the most recent platform activity entries, newest first, for the
 * admin dashboard feed. Scoped by platform_activity_select_admin RLS
 * (`using (is_admin())`) — a non-admin caller gets zero rows.
 */
export async function listPlatformActivity(limit = 12): Promise<ListActivityResult> {
  const { data, error } = await supabase
    .from("platform_activity")
    .select("id, category, message, accent_color, event_id, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { status: "error", message: error.message };

  const items: PlatformActivityItem[] = (data ?? []).map(row => ({
    id: row.id as string,
    category: row.category as ActivityCategory,
    message: row.message as string,
    accentColor: (row.accent_color as string | null) ?? "#1E1B16",
    eventId: (row.event_id as string | null) ?? null,
    actorId: (row.actor_id as string | null) ?? null,
    createdAt: row.created_at as string,
  }));

  return { status: "success", items };
}

export type LogActivityResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Appends a real activity entry (e.g. right after an admin approves or
 * rejects an event — see approveEventApproval()/rejectEventApproval() in
 * approvals.ts). Best-effort: called after the actual approval/event
 * write already succeeded, so a failure here shouldn't roll anything
 * back — callers log a console warning rather than surfacing this as a
 * user-facing error, same convention as logRoleChange() in users.ts.
 */
export async function logActivity(opts: {
  category: ActivityCategory;
  message: string;
  accentColor: string;
  eventId?: string | null;
  actorId?: string | null;
}): Promise<LogActivityResult> {
  const { error } = await supabase.from("platform_activity").insert({
    category: opts.category,
    message: opts.message,
    accent_color: opts.accentColor,
    event_id: opts.eventId ?? null,
    actor_id: opts.actorId ?? null,
  });

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

/** Formats an ISO timestamp as a short relative age, e.g. "2h ago", "Yesterday". Mirrors formatApprovalAge() in approvals.ts. */
export function formatActivityAge(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
