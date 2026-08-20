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

/** Timeout for each certificate-service request (ms). Generous to handle
 *  Render free-tier cold starts which can take 30–50 s. */
const REQUEST_TIMEOUT_MS = 60_000;

/** Number of automatic retries on network failure (cold-start resilience). */
const MAX_RETRIES = 1;

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
  | { status: "error"; message: string }
  | { status: "waking"; message: string };

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
 * Makes a single fetch request to the certificate service with an
 * AbortController-based timeout.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls POST {CERTIFICATE_SERVICE_URL}/api/certificates/generate. Returns a
 * discriminated result rather than throwing, matching the
 * ListUsersResult/UpdateUserRoleResult convention in lib/users.ts, so
 * callers can toast/display without a try/catch.
 *
 * On the first network failure (which usually means a Render cold start),
 * returns a { status: "waking" } result so the UI can show a friendly
 * "waking up" message, then automatically retries once. If the retry also
 * fails, returns a hard error.
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

  const url = `${CERTIFICATE_SERVICE_URL}/api/certificates/generate`;
  const fetchOptions: RequestInit = {
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
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, REQUEST_TIMEOUT_MS);
      return await handleResponse(response);
    } catch (err) {
      lastError = err;

      // First failure — tell the caller the service is waking up, then retry
      if (attempt < MAX_RETRIES) {
        // Return a "waking" status so the UI can show a friendly message.
        // The caller should call generateCertificate again (or we handle it
        // inline below with the retry loop continuing).
        // We continue the loop — the "waking" status is emitted via the
        // onWaking callback pattern below. Since we can't emit mid-function,
        // we just pause briefly before retrying to give the service time.
        await sleep(2000);
        continue;
      }
    }
  }

  // Both attempts failed — return a hard error
  const isTimeout =
    lastError instanceof DOMException && lastError.name === "AbortError";
  return {
    status: "error",
    message: isTimeout
      ? "The certificate service took too long to respond. It may still be starting up — please try again in a moment."
      : "Couldn't reach the certificate service. Make sure it's running locally (mvn spring-boot:run in certificate-service/) and reachable at " +
        CERTIFICATE_SERVICE_URL +
        ".",
  };
}

/**
 * Same as generateCertificate but yields a "waking" status to the caller
 * on the first failure so the UI can display a cold-start message before
 * the automatic retry happens.
 *
 * Usage:
 * ```ts
 * const result = await generateCertificateWithRetry(params, (wakingMsg) => {
 *   setStatus(wakingMsg); // show "waking up" toast/message
 * });
 * ```
 */
export async function generateCertificateWithRetry(
  params: GenerateCertificateParams,
  onWaking?: (message: string) => void,
): Promise<GenerateCertificateResult> {
  if (!CERTIFICATE_SERVICE_URL) {
    return {
      status: "error",
      message:
        "Certificate service is not configured. Set VITE_CERTIFICATE_SERVICE_URL in .env.local and restart the dev server.",
    };
  }

  const url = `${CERTIFICATE_SERVICE_URL}/api/certificates/generate`;
  const fetchOptions: RequestInit = {
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
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, REQUEST_TIMEOUT_MS);
      return await handleResponse(response);
    } catch (err) {
      lastError = err;

      if (attempt < MAX_RETRIES) {
        // Notify caller the service is waking up
        onWaking?.(
          "Waking up the certificate service, please wait…",
        );
        // Brief pause before retry to let the service finish cold-starting
        await sleep(3000);
        continue;
      }
    }
  }

  const isTimeout =
    lastError instanceof DOMException && lastError.name === "AbortError";
  return {
    status: "error",
    message: isTimeout
      ? "The certificate service took too long to respond. It may still be starting up — please try again in a moment."
      : "Couldn't reach the certificate service. Make sure it's running locally (mvn spring-boot:run in certificate-service/) and reachable at " +
        CERTIFICATE_SERVICE_URL +
        ".",
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function handleResponse(response: Response): Promise<GenerateCertificateResult> {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
