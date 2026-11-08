// Pure types, parsing and formatting for the landing page ledger card.
// Data comes from the `public.landing_ledger()` RPC; see
// .kiro/specs/landing-ledger-live-data/design.md.

export interface LedgerRow {
  displayName: string;
  maskedId: string;
  checkedIn: boolean;
  /** ISO timestamp, null for registered-only rows. */
  checkedInAt: string | null;
}

export interface LedgerData {
  ledgerId: string; // "FB-2026-7F2A"
  title: string;
  eventDate: string; // "YYYY-MM-DD"
  venue: string | null;
  code: string;
  rows: LedgerRow[]; // display order; length <= 5
}

/** Raw jsonb as returned by the RPC. */
export interface LedgerPayload {
  ledger_id: string;
  title: string;
  event_date: string;
  venue: string | null;
  code: string;
  rows: Array<{
    display_name: string;
    masked_id: string;
    checked_in: boolean;
    checked_in_at: string | null;
  }>;
}

/** Sample data shown while loading fails or when there is nothing to show. */
export const LEDGER_FALLBACK: LedgerData = {
  ledgerId: "FB-2024-0891",
  title: "Environmental Policy Symposium",
  eventDate: "2024-11-14",
  venue: "Whitman Hall, Rm 204",
  code: "ENV-POL-2024",
  rows: [
    { displayName: "Sarah Chen", maskedId: "SCH-4421", checkedIn: true, checkedInAt: "2024-11-14T09:02:00" },
    { displayName: "Marcus Williams", maskedId: "MWI-3387", checkedIn: true, checkedInAt: "2024-11-14T09:04:00" },
    { displayName: "Priya Patel", maskedId: "PPA-7702", checkedIn: true, checkedInAt: "2024-11-14T09:07:00" },
    { displayName: "James Rodriguez", maskedId: "JRO-9915", checkedIn: true, checkedInAt: "2024-11-14T09:11:00" },
    { displayName: "Aisha Thompson", maskedId: "ATH-2246", checkedIn: false, checkedInAt: null },
  ],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStr = (v: unknown): v is string => typeof v === "string";

/** Returns null for null/empty/malformed payloads. Keeps row order. */
export function parseLedgerPayload(raw: unknown): LedgerData | null {
  if (!isRecord(raw)) return null;
  const { ledger_id, title, event_date, venue, code, rows } = raw;
  if (!isStr(ledger_id) || !isStr(title) || !isStr(event_date) || !isStr(code)) return null;
  if (venue !== null && venue !== undefined && !isStr(venue)) return null;
  if (!Array.isArray(rows)) return null;

  const parsed: LedgerRow[] = [];
  for (const r of rows) {
    if (!isRecord(r)) return null;
    const { display_name, masked_id, checked_in, checked_in_at } = r;
    if (!isStr(display_name) || !isStr(masked_id) || typeof checked_in !== "boolean") return null;
    if (checked_in_at !== null && checked_in_at !== undefined && !isStr(checked_in_at)) return null;
    parsed.push({
      displayName: display_name,
      maskedId: masked_id,
      checkedIn: checked_in,
      checkedInAt: checked_in_at ?? null,
    });
  }

  return {
    ledgerId: ledger_id,
    title,
    eventDate: event_date,
    venue: venue ?? null,
    code,
    rows: parsed,
  };
}

/** "09:02" in the visitor's local time, or "—" when null/invalid. */
export function formatLedgerTime(iso: string | null): string {
  if (typeof iso !== "string") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 14, 2024" from "YYYY-MM-DD" without timezone drift. */
export function formatLedgerDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof isoDate === "string" ? isoDate : "");
  if (!m) return isoDate;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return isoDate;
  return `${MONTHS[month - 1]} ${Number(m[3])}, ${m[1]}`;
}

const LEDGER_TIMEOUT_MS = 8000;

/** Calls the RPC with an 8 s timeout. Resolves LedgerData | null, rejects on error. */
export async function fetchLandingLedger(): Promise<LedgerData | null> {
  // Check env before importing the client: supabaseClient throws at module
  // load when these are missing.
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }

  const { supabase } = await import("./supabaseClient");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEDGER_TIMEOUT_MS);
  try {
    const { data, error } = await supabase.rpc("landing_ledger").abortSignal(controller.signal);
    if (error) throw error;
    return parseLedgerPayload(data);
  } finally {
    clearTimeout(timer);
  }
}
