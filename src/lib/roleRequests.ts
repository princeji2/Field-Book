import { supabase } from "./supabaseClient";
import type { AppRole } from "./auth";

// Backs the Role Change Request feature: role_change_requests
// (supabase/migrations/20260817120000_role_change_requests.sql). A user can
// request a change to their own role; only an admin's approve/reject
// action ever actually writes profiles.role — this file never updates
// profiles directly, matching profiles_update_own's RLS, which forbids a
// user from changing their own role through any path.

export type RoleChangeStatus = "pending" | "approved" | "rejected";

export interface RoleChangeRequest {
  id: string;
  currentRole: AppRole;
  requestedRole: AppRole;
  status: RoleChangeStatus;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
}

/** Same as RoleChangeRequest, plus who submitted it — for the admin queue. */
export interface AdminRoleChangeRequest extends RoleChangeRequest {
  userId: string;
  requesterName: string;
  requesterEmail: string;
}

/** Maps role_change_requests errors to user-safe copy, same convention as auth.ts's otpErrorMessage. */
function roleRequestErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    // Postgres unique_violation — idx_role_change_requests_one_pending_per_user.
    case "23505":
      return "You already have a pending role change request.";
    // Postgres check_violation — either requested_role_differs (requesting
    // the role you already have) or the current_role/requested_role enum
    // check, though the UI shouldn't be able to trigger the latter.
    case "23514":
      return "That isn't a valid role change.";
    default:
      return "Something went wrong submitting your request. Please try again.";
  }
}

/** Maps approve/reject RPC errors (raised explicitly in the migration's functions) to user-safe copy. */
function resolveRequestErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case "42501":
      return "You don't have permission to resolve this request.";
    case "P0002":
      return "This request no longer exists.";
    case "22023":
      return "This request has already been resolved.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function toRoleChangeRequest(row: Record<string, unknown>): RoleChangeRequest {
  return {
    id: row.id as string,
    currentRole: row.current_role as AppRole,
    requestedRole: row.requested_role as AppRole,
    status: row.status as RoleChangeStatus,
    reason: (row.reason as string | null) ?? null,
    createdAt: row.created_at as string,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    adminNote: (row.admin_note as string | null) ?? null,
  };
}

export type GetMyRoleChangeRequestsResult =
  | { status: "success"; requests: RoleChangeRequest[] }
  | { status: "error"; message: string };

/**
 * Lists the calling user's own role change requests (pending + resolved),
 * newest first. Scoped entirely by role_change_requests_select_own RLS —
 * no explicit user_id filter needed, same pattern as listUsers() relying
 * on profiles_select_admin.
 */
export async function getMyRoleChangeRequests(): Promise<GetMyRoleChangeRequestsResult> {
  const { data, error } = await supabase
    .from("role_change_requests")
    .select("id, current_role, requested_role, status, reason, created_at, reviewed_at, admin_note")
    .order("created_at", { ascending: false });

  if (error) return { status: "error", message: error.message };
  return { status: "success", requests: (data ?? []).map(toRoleChangeRequest) };
}

export type CreateRoleChangeRequestResult =
  | { status: "success"; request: RoleChangeRequest }
  | { status: "error"; message: string };

/**
 * Submits a new role change request for the calling user. `currentRole`
 * must match the caller's actual profiles.role — enforced by
 * role_change_requests_insert_own's `current_role = current_profile_role()`
 * check, so a stale/incorrect value passed here fails at the database
 * rather than silently recording the wrong "before" state. Fails with a
 * friendly message (rather than a raw constraint error) if the user
 * already has a pending request (unique index) or requests the role they
 * already hold (check constraint).
 */
export async function createRoleChangeRequest(opts: {
  userId: string;
  currentRole: AppRole;
  requestedRole: AppRole;
  reason?: string;
}): Promise<CreateRoleChangeRequestResult> {
  const { data, error } = await supabase
    .from("role_change_requests")
    .insert({
      user_id: opts.userId,
      current_role: opts.currentRole,
      requested_role: opts.requestedRole,
      reason: opts.reason?.trim() || null,
    })
    .select("id, current_role, requested_role, status, reason, created_at, reviewed_at, admin_note")
    .single();

  if (error) return { status: "error", message: roleRequestErrorMessage(error) };
  return { status: "success", request: toRoleChangeRequest(data) };
}

export type ListRoleChangeRequestsResult =
  | { status: "success"; requests: AdminRoleChangeRequest[] }
  | { status: "error"; message: string };

/**
 * Lists every role change request, for the admin review queue. Scoped by
 * role_change_requests_select_admin RLS — a non-admin caller simply gets
 * back their own request(s) via select_own instead, same "RLS narrows the
 * result set rather than erroring" pattern as listUsers().
 *
 * Requester name/email isn't embedded via a PostgREST join here (unlike a
 * single-FK table) because role_change_requests has two FKs to profiles
 * — user_id and reviewed_by — which PostgREST can't disambiguate with the
 * implicit `profiles(...)` embed syntax. A second query by id list is used
 * instead, mirroring how event_certificate_recipients-style lookups in
 * this codebase already separate "the record" from "the profile it points
 * to" rather than relying on an embed.
 */
export async function listRoleChangeRequests(): Promise<ListRoleChangeRequestsResult> {
  const { data, error } = await supabase
    .from("role_change_requests")
    .select("id, user_id, current_role, requested_role, status, reason, created_at, reviewed_at, admin_note")
    .order("created_at", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const rows = data ?? [];
  const userIds = Array.from(new Set(rows.map(r => r.user_id as string)));

  let profilesById = new Map<string, { fullName: string; email: string }>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profilesError) return { status: "error", message: profilesError.message };

    profilesById = new Map(
      (profiles ?? []).map(p => [p.id as string, { fullName: p.full_name as string, email: p.email as string }]),
    );
  }

  const requests: AdminRoleChangeRequest[] = rows.map(row => {
    const requester = profilesById.get(row.user_id as string);
    return {
      ...toRoleChangeRequest(row),
      userId: row.user_id as string,
      requesterName: requester?.fullName ?? "Unknown user",
      requesterEmail: requester?.email ?? "",
    };
  });

  return { status: "success", requests };
}

export type ResolveRoleChangeRequestResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Approves a pending request: atomically sets its status to 'approved',
 * writes the new role to the requester's profiles row, and logs an
 * audit_log entry — all inside approve_role_change_request() (SECURITY
 * DEFINER), so none of those three effects can happen without the others.
 * See the migration for why this is an RPC rather than a client-side
 * `.update()` + separate profiles write.
 */
export async function approveRoleChangeRequest(
  requestId: string,
  adminNote?: string,
): Promise<ResolveRoleChangeRequestResult> {
  const { error } = await supabase.rpc("approve_role_change_request", {
    p_request_id: requestId,
    p_admin_note: adminNote?.trim() || null,
  });

  if (error) return { status: "error", message: resolveRequestErrorMessage(error) };
  return { status: "success" };
}

/** Rejects a pending request: sets status to 'rejected' and logs an audit_log entry. No profiles write happens. */
export async function rejectRoleChangeRequest(
  requestId: string,
  adminNote?: string,
): Promise<ResolveRoleChangeRequestResult> {
  const { error } = await supabase.rpc("reject_role_change_request", {
    p_request_id: requestId,
    p_admin_note: adminNote?.trim() || null,
  });

  if (error) return { status: "error", message: resolveRequestErrorMessage(error) };
  return { status: "success" };
}
