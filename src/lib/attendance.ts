import { supabase } from "./supabaseClient";

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
