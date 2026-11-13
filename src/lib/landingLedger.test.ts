import { describe, expect, it } from "vitest";
import { LEDGER_FALLBACK, parseLedgerPayload } from "./landingLedger";

// Milestone 1A: landing_ledger() no longer returns the attendance code.
// The parser must accept the new payload (otherwise the landing page would
// silently fall back to sample data) and must never surface a code from the
// live RPC, even if an older server still sends one.

const row = { display_name: "Prince N.", masked_id: "PN-C95A", checked_in: true, checked_in_at: "2026-08-18T11:46:00Z" };

const livePayload = {
  ledger_id: "FB-2026-6645",
  title: "Webinar",
  event_date: "2026-08-18",
  venue: "campus",
  rows: [row],
};

describe("parseLedgerPayload", () => {
  it("accepts the new payload without a code", () => {
    const parsed = parseLedgerPayload(livePayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Webinar");
    expect(parsed?.ledgerId).toBe("FB-2026-6645");
    expect(parsed?.rows).toHaveLength(1);
    expect(parsed?.rows[0]).toEqual({
      displayName: "Prince N.",
      maskedId: "PN-C95A",
      checkedIn: true,
      checkedInAt: "2026-08-18T11:46:00Z",
    });
  });

  it("does not expose a code even if an older server sends one", () => {
    const parsed = parseLedgerPayload({ ...livePayload, code: "WEBINAR-2026-3W8E" });
    expect(parsed).not.toBeNull();
    expect(parsed?.code).toBeUndefined();
    expect(JSON.stringify(parsed)).not.toContain("WEBINAR-2026-3W8E");
  });

  it("still rejects malformed payloads", () => {
    expect(parseLedgerPayload(null)).toBeNull();
    expect(parseLedgerPayload({ ...livePayload, title: 42 })).toBeNull();
    expect(parseLedgerPayload({ ...livePayload, rows: "nope" })).toBeNull();
    expect(parseLedgerPayload({ ...livePayload, rows: [{ ...row, checked_in: "yes" }] })).toBeNull();
  });

  it("keeps the sample fallback code (sample data, not a real credential)", () => {
    expect(LEDGER_FALLBACK.code).toBe("ENV-POL-2024");
  });
});
