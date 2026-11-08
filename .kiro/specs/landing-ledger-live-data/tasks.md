# Implementation Plan: Landing Ledger Live Data

## Overview

Replace the hard-coded `HeroLedger` data in `src/app/shared.tsx` with live data from a new `SECURITY DEFINER` RPC, `public.landing_ledger()`. Work proceeds database first, then the pure TypeScript module, then the hook, then the component, then tests and verification. The language is TypeScript (frontend) and SQL (migration), as already used in the project. The Fieldbook design system is frozen; no new colors, shadows, blurs, or gradients.

## Tasks

- [x] 1. Create the database migration
  - [x] 1.1 Write `supabase/migrations/20260908120000_landing_ledger_rpc.sql`
    - Define `public.landing_ledger()` returning `jsonb`, `language sql`, `stable`, `security definer`, `set search_path = public`
    - Implement the `featured`, `pinned`, `participants`, `named`, and `selected` CTEs from the design, including the `btrim(p.full_name) <> ''` filter in `named`
    - Look up the pinned student by full name or email inside SQL only (fill the owner email literal from the owner's profile; ask the user if it is not known)
    - Build the payload with `ledger_id`, `title`, `event_date`, `venue`, `code`, and `rows` (`display_name`, `masked_id`, `checked_in`, `checked_in_at`); return SQL NULL when no event has attendance
    - Add `revoke all ... from public` and `grant execute ... to anon, authenticated`, following `20260822120000_event_attendees_rpc.sql`
    - Do not touch any RLS policy on `profiles`, `events`, `attendance`, or `registrations`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.6_

- [x] 2. Implement the pure frontend module
  - [x] 2.1 Create `src/lib/landingLedger.ts` with types, fallback, and parsing
    - Export `LedgerRow`, `LedgerData`, `LedgerPayload`
    - Export `LEDGER_FALLBACK` using the five sample attendees and header currently in `HeroLedger`
    - Implement `parseLedgerPayload(raw: unknown): LedgerData | null` (null for null, non-object, missing fields, or non-array `rows`; preserves row order)
    - Implement `formatLedgerTime` (`HH:mm` local time, or `—` for null/invalid, never throws) and `formatLedgerDate` (no timezone drift)
    - Contain no reference to the pinned student's name
    - _Requirements: 4.5, 5.2, 5.5, 6.2, 6.3_

  - [x] 2.2 Add `fetchLandingLedger` to `src/lib/landingLedger.ts`
    - Reject with a config error when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, before importing the client
    - Otherwise dynamically import `./supabaseClient` and call `supabase.rpc("landing_ledger")` with an `AbortController` that aborts after 8000 ms
    - Throw on RPC error; resolve `parseLedgerPayload(data)` otherwise
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 3. Implement the hook
  - [x] 3.1 Create `src/lib/useLandingLedger.ts`
    - Export `LedgerStatus` (`"loading" | "live" | "fallback"`) and `useLandingLedger(): { status, data }`
    - Start at `{ status: "loading", data: LEDGER_FALLBACK }`; set `live` on a non-null result, `fallback` on null
    - On rejection call `console.error("[landing-ledger]", err)` once and set `fallback`; show no visible error
    - Use an `ignore` flag in effect cleanup to prevent updates after unmount
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 4. Update `HeroLedger` in `src/app/shared.tsx`
  - [x] 4.1 Wire live data and loading state
    - Read `{ status, data }` from `useLandingLedger()`; render header ID (with leading `#`), title, date, venue, and footer code from `data`
    - Map `data.rows` in the returned order, keeping green dot, mono time, and `Check` icon for verified rows and divider dot, `—`, and hollow circle for pending rows
    - For `loading`, render `bg-[#DCD4C2]` placeholder bars at real text heights in the header and five rows, with no shimmer, pulse, or gradient; footer and Seal render normally
    - Keep the existing card surface, header, row patterns, single Seal, and empty props (no call-site change in `organizer.tsx`)
    - Apply standard mount motion to rows (`opacity 0 -> 1`, `y 8 -> 0`, `0.25s easeOut`, stagger `index * 0.07`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 8.1, 8.2, 8.3, 8.4_

  - [x] 4.2 Apply the responsive grid to the column head and rows
    - Replace `grid-cols-[1fr,auto,auto]` with a stacked layout below 640 px and `sm:grid-cols-[1fr_auto_auto]` at 640 px and wider, on both the column head and each row so columns align
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2_

- [x] 5. Checkpoint - Ensure the code compiles
  - Run `npm run typecheck`. Ensure it passes, ask the user if questions arise.

- [x] 6. Set up the test tooling
  - [x] 6.1 Add vitest and fast-check
    - Install `vitest` and `fast-check` as devDependencies with exact pinned versions
    - Add a `"test": "vitest --run"` script to `package.json`
    - Add a minimal vitest config (node environment; `jsdom` only if a component test needs it) without altering the Vite build config
    - _Requirements: 9.1_

  - [ ]* 6.2 Write property test for payload parsing
    - Create `src/lib/landingLedger.test.ts` with a tag comment `Feature: landing-ledger-live-data, Property 1: Payload parsing preserves order and content`
    - **Property 1: Payload parsing preserves order and content**
    - **Validates: Requirements 5.2, 5.5**

  - [ ]* 6.3 Write property test for invalid payloads
    - **Property 2: Invalid payloads parse to null**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 6.4 Write property test for time formatting
    - **Property 10: Time formatting is total**
    - **Validates: Requirements 5.2**

  - [ ]* 6.5 Write property tests for name, ID, and Ledger_ID rules
    - Implement the reference-model helpers in the test file (they mirror the SQL rules and are not shipped code)
    - **Property 3: Display name format**
    - **Validates: Requirements 3.5, 3.6**
    - **Property 4: Masked ID format**
    - **Validates: Requirements 3.5**
    - **Property 6: Ledger ID format and determinism**
    - **Validates: Requirements 2.3**

  - [ ]* 6.6 Write property tests for row selection and ordering
    - Implement `selectLedgerRows` as the reference model in test code
    - **Property 7: Row selection cap, uniqueness, and fill**
    - **Validates: Requirements 3.1, 3.4, 3.7, 4.3**
    - **Property 8: Row ordering**
    - **Validates: Requirements 3.2, 3.3, 4.2**
    - **Property 9: Pinned student is never dropped**
    - **Validates: Requirements 4.1, 4.6**

  - [ ]* 6.7 Write property test for payload privacy
    - **Property 5: Payload never exposes sensitive fields**
    - **Validates: Requirements 1.6, 1.7**

  - [ ]* 6.8 Write unit tests for fetch and hook behavior
    - Fallback on RPC error (one `console.error`, nothing visible), on `null`, and on missing env vars
    - 8000 ms timeout using fake timers
    - Loading state while the promise is pending
    - Check that `src/` contains no reference to the pinned student's name
    - _Requirements: 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Run `npm run test` if tests were written. Ensure all tests pass, ask the user if questions arise.

- [x] 8. Build verification
  - [x] 8.1 Run `tsc` and the Vite production build
    - Run `npm run typecheck` and `npm run build`; fix any errors until both finish with zero errors
    - Grep the changed files for `shadow`, `blur`, and `gradient` to confirm Design_System compliance
    - _Requirements: 8.2, 9.1, 9.2_

- [x] 9. Playwright verification
  - [x] 9.1 Check the landing page with Playwright MCP
    - Ask the user to start `npm run dev` (do not start it from this task) and use `http://localhost:5173`
    - Confirm the card loads, header and rows render, and the console shows no unexpected errors
    - At 1280 px confirm the 3-column aligned grid; at 375 px confirm stacked columns
    - Block the RPC request and confirm Fallback_Data appears with no visible error
    - Diagnose, fix, and re-test any failure
    - _Requirements: 5.1, 5.2, 6.2, 7.1, 7.2, 7.3, 9.3_

- [x] 10. Final report
  - [x] 10.1 Produce the handoff report
    - List the files changed (created, modified, deleted)
    - Include the full migration SQL to run, and note that it must be applied to Supabase (SQL editor or `supabase db push`)
    - Give local test steps: apply the migration, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`, run `npm run dev`, open `http://localhost:5173`, run `npm run test`, `npm run typecheck`, `npm run build`
    - State the tests and checks actually run, Playwright results, and remaining issues, including the pinned-student interpretation and the owner email literal
    - _Requirements: 9.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests 3 to 9 run against a TypeScript reference model of the SQL rules; the real RPC is checked in the integration and Playwright steps
- Do not run `npm run dev` from a task; ask the user to start it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "6.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["8.1"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["10.1"] }
  ]
}
```
