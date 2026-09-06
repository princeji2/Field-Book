// Student-facing access to the `notifications` table.
//
// Reads are scoped by the notifications_select_own RLS policy
// (user_id = auth.uid()); an explicit .eq("user_id", ...) is also applied so
// the query is correct and cheap regardless, and can never surface another
// user's rows. Marking-as-read goes through notifications_update_own
// (user_id = auth.uid()) — a user can only ever flip their own rows.
//
// There is intentionally NO client insert path here: notification rows are
// created only by the SECURITY DEFINER triggers/function added in
// supabase/migrations/20260821120000_notifications_events.sql (on
// registration / attendance / certificate events), or by an admin via
// notifications_insert_admin. The frontend never writes notifications.
//
// Category / event_id / metadata columns come from that same migration.

import { supabase } from "./supabaseClient";
import type { NotifGroup } from "../app/shared";

// Category values match the CHECK constraint on notifications.category
// (20260821120000_notifications_events.sql). 'event_reminder' is reserved
// for a later step (no rows produced yet); 'general' is the fallback /
// admin-broadcast default.
export type NotificationCategory =
  | "certificate_issued"
  | "registration_confirmed"
  | "registration_cancelled"
  | "attendance_confirmed"
  | "event_reminder"
  | "general";

/**
 * A single notification row for the signed-in user, flattened for the UI.
 * Field names mirror what the student NotificationsScreen / dashboard
 * "Recent Activity" strip render, so the UI can consume this without a
 * separate mapping layer.
 */
export interface NotificationItem {
  id: string;
  /** notifications.category — drives the UI icon/eyebrow. */
  category: NotificationCategory | string;
  /** notifications.message — the human-readable line. */
  message: string;
  /** notifications.event_id — deep-link target, may be null. */
  eventId: string | null;
  /**
   * notifications.metadata — small display-only payload (e.g.
   * { code: "CERT-FB-..." }). Non-authoritative; rendered as text only.
   */
  metadata: Record<string, unknown> | null;
  /** notifications.read. */
  read: boolean;
  /** ISO timestamp from notifications.created_at. */
  createdAt: string;
}

export type ListNotificationsResult =
  | { status: "success"; notifications: NotificationItem[] }
  | { status: "error"; message: string };

interface NotificationRow {
  id: string;
  category: string;
  message: string;
  event_id: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

/**
 * Lists the signed-in user's notifications, newest first. Scoped by
 * notifications_select_own RLS; the explicit .eq("user_id", userId) keeps
 * the query correct and cheap and guards against a mismatched id.
 */
export async function listMyNotifications(
  userId: string,
): Promise<ListNotificationsResult> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, category, message, event_id, metadata, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const notifications: NotificationItem[] = ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    category: row.category,
    message: row.message,
    eventId: row.event_id ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    read: row.read,
    createdAt: row.created_at,
  }));

  return { status: "success", notifications };
}

export type UnreadCountResult =
  | { status: "success"; count: number }
  | { status: "error"; message: string };

/**
 * Returns the signed-in user's unread notification count. Uses a
 * head/count query (no rows transferred), backed by the
 * idx_notifications_unread partial index. Scoped by
 * notifications_select_own RLS + an explicit user_id filter.
 */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<UnreadCountResult> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return { status: "error", message: error.message };
  return { status: "success", count: count ?? 0 };
}

export type MarkReadResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Marks a single notification read. Governed by notifications_update_own
 * (user_id = auth.uid()) — a user can only flip their own row, so no
 * explicit ownership filter beyond the id is required for security, though
 * RLS handles the scoping.
 */
export async function markNotificationRead(id: string): Promise<MarkReadResult> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

/**
 * Marks all of the signed-in user's unread notifications read in one call.
 * The explicit .eq("user_id", userId) matches notifications_update_own and
 * limits the update to unread rows only.
 */
export async function markAllNotificationsRead(userId: string): Promise<MarkReadResult> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

/**
 * Formats an ISO timestamp as a short relative age, e.g. "2h ago",
 * "Yesterday". Mirrors formatActivityAge() in activity.ts /
 * formatApprovalAge() in approvals.ts so the notifications UI reads the same
 * as the rest of the app.
 */
export function formatNotificationAge(iso: string): string {
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

/**
 * Buckets a notification into the Today / Earlier this week / Older groups
 * the NotificationsScreen renders (NOTIF_GROUPS in shared.tsx), derived
 * purely from created_at — no stored group column.
 */
export function groupNotificationByRecency(iso: string): NotifGroup {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "older";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 7) return "week";
  return "older";
}
