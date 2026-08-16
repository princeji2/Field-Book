import { supabase } from "./supabaseClient";
import type { AppRole } from "./auth";
import type { UserRole } from "../app/admin/shell";

// Guest sessions and unauthenticated visitors never have a real user id to
// attribute a write to, so callers should skip both updateUserRole() and
// logRoleChange() entirely rather than let them fail silently.

// The admin Users screen (src/app/admin/users.tsx) displays roles in
// Title Case ("Student"/"Organizer"/"Admin" — UserRole), but the database
// stores them lowercase per profiles' check constraint (AppRole). These
// mappers are the single place that conversion happens, mirroring how
// auth.ts keeps AppRole as the DB-shaped type and leaves presentation
// casing to the frontend.
export function dbRoleToUserRole(role: AppRole): UserRole {
  if (role === "admin") return "Admin";
  if (role === "organizer") return "Organizer";
  return "Student";
}

export function userRoleToDbRole(role: UserRole): AppRole {
  if (role === "Admin") return "admin";
  if (role === "Organizer") return "organizer";
  return "student";
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  memberSince: string;
}

export type ListUsersResult =
  | { status: "success"; users: DirectoryUser[] }
  | { status: "error"; message: string };

/**
 * Lists every profile row visible to the caller. For an authenticated
 * admin, that's every user in the platform — enforced by the
 * profiles_select_admin RLS policy (`using (public.is_admin())`), not by
 * anything in this function. A non-admin caller (or no session at all)
 * simply gets back zero or one row (their own, via profiles_select_own),
 * same as any other authenticated query against this table.
 */
export async function listUsers(): Promise<ListUsersResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, member_since")
    .order("member_since", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const users: DirectoryUser[] = (data ?? []).map(row => ({
    id: row.id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    role: row.role as AppRole,
    memberSince: row.member_since as string,
  }));

  return { status: "success", users };
}

export type UpdateUserRoleResult =
  | { status: "success"; role: AppRole }
  | { status: "error"; message: string };

/**
 * Updates a single profile's role. This is a real write against
 * `profiles`, gated entirely by the profiles_update_admin RLS policy
 * (`using (is_admin()) with check (is_admin())`) — if the calling session
 * isn't an authenticated admin, Postgres returns zero rows updated
 * (no matching row under RLS) rather than this function silently
 * pretending it worked. That's surfaced below as an error rather than a
 * false success.
 */
export async function updateUserRole(id: string, role: UserRole): Promise<UpdateUserRoleResult> {
  const dbRole = userRoleToDbRole(role);

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: dbRole })
    .eq("id", id)
    .select("role")
    .single();

  if (error) {
    // PGRST116 = "no rows returned" from .single() — the most common shape
    // of "the row exists but RLS hid it from this update" (i.e. caller
    // isn't actually an admin), rather than the row simply not existing.
    if (error.code === "PGRST116") {
      return {
        status: "error",
        message: "You don't have permission to change this user's role.",
      };
    }
    return { status: "error", message: error.message };
  }

  return { status: "success", role: data.role as AppRole };
}

/**
 * Records a role change in the audit_log table. Best-effort and
 * fire-and-forget by design: the role change itself already succeeded
 * against `profiles` by the time this runs (see updateUserRole above), so
 * a logging failure here (network blip, RLS surprise, etc.) shouldn't
 * roll back or block on the underlying change — it only means the audit
 * trail has a gap, which is why callers should still toast/console.error
 * on a non-"success" result rather than silently swallowing it.
 *
 * actor_id is set to the calling admin (whoever is performing the change),
 * not the target user — audit_log_insert_admin's RLS check requires
 * `actor_id = auth.uid()`, so this can only ever be attributed truthfully.
 */
export async function logRoleChange(opts: {
  actorId: string;
  targetId: string;
  oldRole: AppRole;
  newRole: AppRole;
}): Promise<{ status: "success" } | { status: "error"; message: string }> {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: opts.actorId,
    target_id: opts.targetId,
    action: "role_change",
    old_value: opts.oldRole,
    new_value: opts.newRole,
  });

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}
