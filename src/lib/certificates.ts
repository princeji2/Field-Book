// Client for certificate-service (a separate Spring Boot backend — see
// certificate-service/README.md), not a Supabase table access module like
// auth.ts/users.ts. The frontend never writes to `certificates` directly:
// that table has no student/organizer INSERT policy (only
// certificates_insert_admin — see supabase/migrations/20260816120000_rls_policies.sql),
// by design. Real issuance happens server-side in certificate-service using
// its service-role key, immediately after it uploads the generated PDF to
// Storage. This module only calls that service's HTTP API and hands back
// whatever URL it returns.

const CERTIFICATE_SERVICE_URL: string | undefined = import.meta.env.VITE_CERTIFICATE_SERVICE_URL;

export interface GenerateCertificateParams {
  studentName: string;
  eventTitle: string;
  templateId: string;
  certificateCode: string;
  /** Optional — omit when there's no real events-table UUID to attach yet (e.g. mock event data). */
  eventId?: string;
  /** Optional — the signed-in student's profiles.id. */
  studentId?: string;
}

export type GenerateCertificateResult =
  | { status: "success"; certificateUrl: string }
  | { status: "error"; message: string };

/**
 * Generates a certificate code in the same shape as the mock data already
 * seen elsewhere in the app (e.g. "CERT-FB-2024-088021" in
 * admin/templates.tsx's PREVIEW_SAMPLE): CERT-FB-<year>-<6 random digits>.
 * Not guaranteed globally unique (certificates.certificate_code has a
 * unique constraint — a collision surfaces as a 502 from the generate call,
 * which is rare enough with 6 random digits not to warrant a retry loop
 * here) but readable and consistent with the rest of the app.
 */
export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100000 + Math.random() * 900000); // 6 digits, no leading zero collapse
  return `CERT-FB-${year}-${suffix}`;
}

/**
 * Calls POST {CERTIFICATE_SERVICE_URL}/api/certificates/generate. Returns a
 * discriminated result rather than throwing, matching the
 * ListUsersResult/UpdateUserRoleResult convention in lib/users.ts, so
 * callers can toast/display without a try/catch.
 */
export async function generateCertificate(
  params: GenerateCertificateParams,
): Promise<GenerateCertificateResult> {
  if (!CERTIFICATE_SERVICE_URL) {
    return {
      status: "error",
      message:
        "Certificate service is not configured. Set VITE_CERTIFICATE_SERVICE_URL in .env.local and restart the dev server.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${CERTIFICATE_SERVICE_URL}/api/certificates/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: params.studentName,
        eventTitle: params.eventTitle,
        templateId: params.templateId,
        certificateCode: params.certificateCode,
        eventId: params.eventId,
        studentId: params.studentId,
      }),
    });
  } catch {
    // Covers network failure, CORS rejection, and "service isn't running" —
    // fetch throws a generic TypeError in all three cases, so the message
    // below has to speak to all of them rather than pretending we know which.
    return {
      status: "error",
      message:
        "Couldn't reach the certificate service. Make sure it's running locally (mvn spring-boot:run in certificate-service/) and reachable at " +
        CERTIFICATE_SERVICE_URL + ".",
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : undefined) ??
      (body && typeof body === "object" && "error" in body && typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined) ??
      `Certificate generation failed (${response.status}).`;
    return { status: "error", message };
  }

  const certificateUrl =
    body && typeof body === "object" && "certificateUrl" in body
      ? (body as { certificateUrl?: unknown }).certificateUrl
      : undefined;

  if (typeof certificateUrl !== "string" || certificateUrl.length === 0) {
    return { status: "error", message: "Certificate service returned an unexpected response." };
  }

  return { status: "success", certificateUrl };
}
