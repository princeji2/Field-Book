# Removed / Archived Code Log

This file tracks everything removed during the safety-first cleanup refactor.
Nothing here is permanently deleted — whole files are moved into `/deprecated/`
preserving their original relative path, and in-file snippet removals are
recorded below with their original location so they can be restored.

To restore an archived file, move it from `/deprecated/<original path>` back to
`<original path>`.

---

## Stage 2 — 2026-08-31 (branch: cleanup/archive-2026-08-31)

### Whole files archived (moved to /deprecated, preserving relative path)

| Original path | Reason | Confidence |
|---|---|---|
| `src/app/components/figma/ImageWithFallback.tsx` | `ImageWithFallback` component defined but never imported anywhere; no `figma:asset/` imports exist — Stage 2 cleanup | HIGH |
| `src/app/components/ui/*` (45 files) + `use-mobile.ts` | Unused shadcn/ui scaffolding; only `sheet.tsx` + `utils.ts` are reachable from app code. User confirmed these are not a maintained library — Stage 2 cleanup | HIGH |
| `src/styles/globals.css` | Empty 0-byte orphan file; not imported by `index.css` or referenced anywhere. Not a superset/source of `theme.css` (it has no content) — Stage 2 cleanup | HIGH |
| `-` (repo root) | Empty 0-byte file, created by an accidental shell redirect; not referenced anywhere — Stage 2 cleanup | HIGH |

Kept intentionally (NOT archived): `src/app/components/ui/sheet.tsx`, `src/app/components/ui/utils.ts` (still used by `organizer.tsx`), and `default_shadcn_theme.css` (has a `KEEP_IN_SYNC` marker — intentional).

### In-file snippet removals

None in this batch — all Stage 2 removals were whole files.
