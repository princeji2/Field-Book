// Student-facing read access to the `certificates` table.
//
// Distinct from lib/certificates.ts, which is an HTTP client for the
// external certificate-service (issuance/PDF generation with the
// service-role key). This module only READS a student's own issued
// certificates through the anon client, scoped entirely by the
// `certificates_select_own_student` RLS policy
// (student_id = auth.uid()) — see
// supabase/migrations/20260816120000_rls_policies.sql. No write path
// lives here; the frontend never inserts into `certificates` by design.
//
// Event context (title/category/department) is resolved via a PostgREST
// embed on the certificates.event_id -> events foreign key. event_id is
// nullable (a certificate may exist without a linked event row), so every
// event-derived field falls back to a generic label rather than assuming
// the embed is present.

import { supabase } from "./supabaseClient";

/**
 * A student's issued certificate, flattened from the `certificates` row
 * plus its embedded `events` context. Field names mirror the CertRecord
 * shape the Certificates screen already renders, so the UI can consume
 * this without a separate mapping layer.
 */
export interface StudentCertificate {
  id: string;
  /** certificates.event_id — may be null when no event is linked. */
  eventId: string;
  eventTitle: string;
  category: string;
  dept: string;
  /** certificates.certificate_code, e.g. "CERT-FB-2024-088021". */
  certCode: string;
  /** ISO timestamp from certificates.issued_at. */
  issuedAt: string;
  /** Storage URL persisted by certificate-service, when present. */
  certificateUrl: string | null;
}

export type ListStudentCertificatesResult =
  | { status: "success"; certificates: StudentCertificate[] }
  | { status: "error"; message: string };

// Shape of the embedded events row returned by the PostgREST join.
// supabase-js types a foreign-table embed as an array even for a to-one
// relationship, so it's modelled here as EmbeddedEvent[] and normalized to
// the first element (or null) at read time.
interface EmbeddedEvent {
  title: string | null;
  category: string | null;
  department: string | null;
}

interface CertificateJoinRow {
  id: string;
  event_id: string | null;
  certificate_code: string;
  issued_at: string;
  certificate_url: string | null;
  events: EmbeddedEvent | EmbeddedEvent[] | null;
}

function firstEmbed(events: EmbeddedEvent | EmbeddedEvent[] | null): EmbeddedEvent | null {
  if (!events) return null;
  return Array.isArray(events) ? (events[0] ?? null) : events;
}

/**
 * Lists the signed-in student's own issued certificates, newest first,
 * with each certificate's event title/category/department resolved in the
 * same query via the events FK embed.
 *
 * Relies on the `certificates_select_own_student` RLS policy for scoping —
 * an explicit `.eq("student_id", studentId)` is added as well so the query
 * is correct and cheap even before RLS filtering, and so passing a
 * mismatched id can never surface someone else's rows.
 */
export async function listMyCertificates(
  studentId: string,
): Promise<ListStudentCertificatesResult> {
  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, event_id, certificate_code, issued_at, certificate_url, events(title, category, department)",
    )
    .eq("student_id", studentId)
    .order("issued_at", { ascending: false });

  if (error) return { status: "error", message: error.message };

  const certificates: StudentCertificate[] = ((data ?? []) as unknown as CertificateJoinRow[]).map(
    (row) => {
      const ev = firstEmbed(row.events);
      return {
        id: row.id,
        eventId: row.event_id ?? "",
        eventTitle: ev?.title ?? "Fieldbook Event",
        category: ev?.category ?? "General",
        dept: ev?.department ?? "General",
        certCode: row.certificate_code,
        issuedAt: row.issued_at,
        certificateUrl: row.certificate_url,
      };
    },
  );

  return { status: "success", certificates };
}
