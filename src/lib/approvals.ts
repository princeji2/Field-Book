import { supabase } from "./supabaseClient";
import type { AppRole } from "./auth";
import type { EventStatus, LocationType } from "./events";
import { logActivity } from "./activity";

// Real writes against the `approvals` table for the organizer-submits /
// admin-approves publishing flow. RLS (approvals_insert_own_organizer)
// requires the calling organizer to own the referenced event, so this is
// only ever called right after that event's own insert succeeds.

export type SubmitApprovalResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Submits a "new_event" approval request for an event the calling
 * organizer owns. Publishing an event is never a direct
 * events.status = 'published' write from the frontend. Organizers can only
 * insert draft events (events_insert_organizer), and the
 * trg_events_enforce_approval_guard trigger
 * (20260909110000_events_approval_guard.sql) rejects any non-admin change to
 * `status`. approvals_insert_own_organizer only accepts a pending,
 * unreviewed row. An admin approving the request (approve_event_approval
 * RPC) is the only path that publishes the event.
 */
export async function submitEventApproval(eventId: string): Promise<SubmitApprovalResult> {
  const { error } = await supabase.from("approvals").insert({
    event_id: eventId,
    type: "new_event",
    status: "pending",
  });

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

// ─── Admin-facing approval queue ────────────────────────────────────────────
//
// Backs the admin ApprovalsScreen/AdminDashboard "needs attention" list.
// approvals has an FK to events, not directly to profiles (the organizer),
// so — same as listRoleChangeRequests() in roleRequests.ts, which has the
// analogous two-FK-hop problem — this can't be a single PostgREST embed.
// Two follow-up queries instead: approvals -> events (by event_id), then
// events -> profiles (by organizer_id).
//
// Fetches every approval regardless of status (not just pending), same
// convention as listRoleChangeRequests(): the tabbed Pending/Approved/
// Rejected UI needs all three, and RLS (approvals_select_admin) already
// scopes this to "every row" only for an actual admin caller — a
// non-admin session gets back just their own events' approvals via
// approvals_select_own_organizer instead.

export type ApprovalType = "new_event" | "recurring" | "capacity_change" | "edit";
export type ApprovalStatus = "pending" | "approved" | "rejected";

/** One approval request, with its linked event's details and the submitting organizer's name/email flattened in. */
export interface AdminApproval {
  id: string;
  eventId: string;
  type: ApprovalType;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedBy: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  // Event snapshot (as of the time of the query — not a point-in-time
  // copy, so if an organizer edits a draft after submitting, this reflects
  // the latest edit, matching how the rest of the app treats `events` as
  // the single live source of truth).
  eventTitle: string;
  eventCode: string;
  eventStatus: EventStatus;
  department: string | null;
  category: string | null;
  description: string | null;
  locationType: LocationType;
  venue: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  capacity: number;
  // Organizer snapshot.
  organizerId: string | null;
  organizerName: string;
  organizerEmail: string;
  organizerRole: AppRole | null;
}

export type ListApprovalsResult =
  | { status: "success"; approvals: AdminApproval[] }
  | { status: "error"; message: string };

/** Lists every approval request (any status), newest submission first, for the admin review queue. */
export async function listApprovals(): Promise<ListApprovalsResult> {
  const { data: approvalRows, error: approvalsError } = await supabase
    .from("approvals")
    .select("id, event_id, type, status, submitted_at, reviewed_by, resolved_at, rejection_reason")
    .order("submitted_at", { ascending: false });

  if (approvalsError) return { status: "error", message: approvalsError.message };

  const rows = approvalRows ?? [];
  if (rows.length === 0) return { status: "success", approvals: [] };

  const eventIds = Array.from(new Set(rows.map(r => r.event_id as string)));
  const { data: eventRows, error: eventsError } = await supabase
    .from("events")
    .select("id, title, code, organizer_id, department, category, description, location_type, venue, event_date, start_time, end_time, capacity, status")
    .in("id", eventIds);

  if (eventsError) return { status: "error", message: eventsError.message };

  type EventLite = {
    id: string; title: string; code: string; organizer_id: string | null;
    department: string | null; category: string | null; description: string | null;
    location_type: LocationType; venue: string | null; event_date: string;
    start_time: string | null; end_time: string | null; capacity: number; status: EventStatus;
  };
  const eventsById = new Map<string, EventLite>((eventRows ?? []).map(e => [e.id as string, e as EventLite]));

  const organizerIds = Array.from(
    new Set(Array.from(eventsById.values()).map(e => e.organizer_id).filter((id): id is string => !!id)),
  );

  let profilesById = new Map<string, { fullName: string; email: string; role: AppRole }>();
  if (organizerIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", organizerIds);

    if (profilesError) return { status: "error", message: profilesError.message };

    profilesById = new Map(
      (profileRows ?? []).map(p => [p.id as string, { fullName: p.full_name as string, email: p.email as string, role: p.role as AppRole }]),
    );
  }

  const approvals: AdminApproval[] = rows.map(row => {
    const ev = eventsById.get(row.event_id as string);
    const organizer = ev?.organizer_id ? profilesById.get(ev.organizer_id) : undefined;
    return {
      id: row.id as string,
      eventId: row.event_id as string,
      type: row.type as ApprovalType,
      status: row.status as ApprovalStatus,
      submittedAt: row.submitted_at as string,
      reviewedBy: (row.reviewed_by as string | null) ?? null,
      resolvedAt: (row.resolved_at as string | null) ?? null,
      rejectionReason: (row.rejection_reason as string | null) ?? null,
      eventTitle: ev?.title ?? "Untitled event",
      eventCode: ev?.code ?? "—",
      eventStatus: ev?.status ?? "draft",
      department: ev?.department ?? null,
      category: ev?.category ?? null,
      description: ev?.description ?? null,
      locationType: ev?.location_type ?? "in-person",
      venue: ev?.venue ?? null,
      eventDate: ev?.event_date ?? "",
      startTime: ev?.start_time ?? null,
      endTime: ev?.end_time ?? null,
      capacity: ev?.capacity ?? 0,
      organizerId: ev?.organizer_id ?? null,
      organizerName: organizer?.fullName ?? "Unknown organizer",
      organizerEmail: organizer?.email ?? "",
      organizerRole: organizer?.role ?? null,
    };
  });

  return { status: "success", approvals };
}

export type ResolveApprovalResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Approves a pending approval request through the admin-only
 * `approve_event_approval` RPC (20260909110000_events_approval_guard.sql).
 * In one transaction it publishes the linked event (only if it is still a
 * draft) and marks the approval approved with reviewed_by = the calling
 * admin. The RPC itself checks is_admin(), so a non-admin caller gets a
 * 42501 error here rather than a partial update.
 *
 * `reviewerId` is kept for the activity-log entry only. The database records
 * the reviewer from auth.uid(), not from this argument.
 */
export async function approveEventApproval(
  approvalId: string,
  eventId: string,
  reviewerId: string,
  eventTitle?: string,
): Promise<ResolveApprovalResult> {
  const { error } = await supabase.rpc("approve_event_approval", { p_approval_id: approvalId });

  if (error) {
    if (error.code === "42501") return { status: "error", message: "Only admins can approve events." };
    if (error.code === "22023") return { status: "error", message: "This request has already been resolved." };
    if (error.code === "P0002") return { status: "error", message: "This request or its event no longer exists." };
    return { status: "error", message: `Couldn't approve the event: ${error.message}` };
  }

  // Best-effort activity log entry — the approval itself already
  // succeeded above, so a failure here shouldn't be surfaced as an error
  // to the admin (see logActivity()'s own doc comment).
  void logActivity({
    category: "event_approved",
    message: `${eventTitle ?? "An event"} — approved and published`,
    accentColor: "#2E6B4C",
    eventId,
    actorId: reviewerId,
  });

  return { status: "success" };
}

/**
 * Rejects a pending approval request. Deliberately does NOT touch the
 * linked event row — it stays exactly as the organizer left it (status
 * 'draft') so they can see the rejection reason, edit, and resubmit via
 * submitEventApproval() rather than losing their draft.
 */
export async function rejectEventApproval(
  approvalId: string,
  reviewerId: string,
  rejectionReason: string | null,
  eventId?: string,
  eventTitle?: string,
): Promise<ResolveApprovalResult> {
  const { error } = await supabase
    .from("approvals")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      rejection_reason: rejectionReason?.trim() || null,
    })
    .eq("id", approvalId);

  if (error) return { status: "error", message: error.message };

  void logActivity({
    category: "event_rejected",
    message: `${eventTitle ?? "An event"} — rejected`,
    accentColor: "#B5432E",
    eventId: eventId ?? null,
    actorId: reviewerId,
  });

  return { status: "success" };
}

/** Formats an ISO timestamp as a short relative age, e.g. "2h ago", "Yesterday", "Nov 13, 2024". Used by the admin approvals queue's "Submitted" column. */
export function formatApprovalAge(iso: string): string {
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

/** Formats an ISO timestamp as "Nov 13, 2024 · 10:22 AM", for the approval detail panel. */
export function formatApprovalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}
