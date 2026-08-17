import { supabase } from "./supabaseClient";

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
 * events.status = 'published' write from the frontend — the
 * events_insert_organizer / events_update_own_organizer RLS policies
 * don't allow organizers to set status to anything but 'draft' themselves.
 * An admin approving the request (ApprovalsScreen) is what eventually
 * flips the event's status server-side.
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
