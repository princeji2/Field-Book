# Fieldbook — Prototype → Production Migration Guide

**Figma Make (Vite/React prototype) → Kiro Pro+ + Supabase**

---

## How to use this guide

This guide moves the Fieldbook prototype out of Figma Make and into Kiro Pro+, wires it up to a real Supabase backend (real auth, a real database, real file storage) via Kiro's Supabase Power, and replaces the mock/local-state logic with production data.

Two modes, every prompt:

- **Vibe Mode** — fast, single-shot edit. One file, one clear change. Cheapest credit cost.
- **Spec Mode** — Kiro writes `requirements.md`, `design.md`, and `tasks.md` before touching code. Slower and pricier per prompt, but catches schema/logic mistakes on paper. Use it anywhere this guide touches data models, auth, or security.

Work through this file **one step at a time**. Copy each prompt exactly as written, run it in the mode noted, review the result (and the generated design doc, in Spec Mode) before approving, and confirm it works before moving on.

| Model | Best for | Mode to pair it with |
|---|---|---|
| Claude Sonnet 5 | Everyday steps: imports, config, storage plumbing, routing, verification passes. | Vibe Mode (~0.04 credit) |
| Claude Opus 4.7 / 4.8 | Steps with real design decisions: auth logic, schema + foreign keys, RLS policies. | Spec Mode (~0.20 credit) — worth it, the reasoning shows up in the design doc you can review before code runs. |
| Amazon Nova | Trivial, low-stakes edits (copy tweaks, formatting) when you want to save credits. | Vibe Mode |

> Kiro's UI, exact panel names (Powers, Steering, Specs), and model list shift over time — if a labeled button or model name doesn't match exactly, look for the nearest equivalent.

---

## Before You Start

- [ ] Confirm the sign-in flow is not stuck in a loop (Role Select → Login → Role Select). Fix this in Figma Make first if you haven't already — small, contained, easier to verify there.
- [ ] Confirm guest mode locking is extended to all three roles (Admin, Organizer, Student), not just Admin.
- [ ] Add the "Change role" back-link on the login screen (navigates back to admin-role-confirm), and remove the now-unused `singleRole` auto-redirect logic in `AdminRoleConfirmScreen`.
- [ ] Export your project as a `.zip` from Figma Make and keep a copy — fallback if anything goes wrong during import.
- [ ] Have your `Guidelines.md` (design system rules) handy — it becomes a Kiro steering file shortly.

---

## Step 1 — Push Your Code to GitHub

Kiro imports from a GitHub repository, not a `.zip` file. If it's already on GitHub, skip to Step 2.

If not:
- Create a new, empty repo on GitHub (e.g. `fieldbook-app`).
- Unzip your latest Figma Make export locally.
- From that folder: `git init`, `git add .`, `git commit -m "Initial import from Figma Make"`, then push to `main`.

> If you're not comfortable with git commands, GitHub Desktop does this with drag-and-drop.

---

## Step 2 — Import Into Kiro

### 2.1 Create the project

- In Kiro, choose "Import from GitHub" and select your repository.
- Let Kiro finish its initial analysis and suggest a starter steering document.
- Open the project and confirm it builds and the Landing Page renders before doing anything else.

**Model & Mode:** Vibe Mode · Claude Sonnet 5 — verification, not design work.

### 2.2 Re-anchor the design system

Create `dev.kiro/steering/design-system.md`, paste in your `Guidelines.md`, set inclusion to **Always** so it's frozen context on every future prompt (across specs, hooks, and every mode).

```
Treat the attached Guidelines.md as a frozen design system for this
project. Do not introduce colors outside its 8 listed tokens, and
keep the Fraunces / Public Sans / IBM Plex Mono role assignments
exactly as specified. Confirm you've read it before making any
other changes.
```

**Model & Mode:** Vibe Mode · Claude Sonnet 5 — transcribing a doc you already have.

---

## Step 3 — Connect Supabase

Foundation for everything else — real auth, database, and file storage all live here once connected.

### 3.1 Install the Supabase Power

- Open the Powers panel in Kiro's sidebar → install "Supabase (hosted)". Bundles the Supabase MCP server with steering files for schema/RLS/edge-function conventions.
- Provide your Supabase project URL and anon/service key when prompted — stored as env vars in `mcp.json`, never hardcoded into a prompt.
- Confirm the power shows connected (Kiro can list your existing tables) before prompting any database changes.

**Model & Mode:** — no prompt needed, one-click install.

### 3.2 Set up real authentication

```
Replace the current fake sign-in flow (AdminLoginScreen's
setTimeout-based success state) with real Supabase email/password
authentication. On successful sign-up, create a corresponding row
in a new "profiles" table storing: user id, full name, role
(admin / organizer / student), and created_at. On sign-in, fetch
the user's role from "profiles" and route them to the correct
dashboard automatically — do not show the manual role-selection
screen for returning users, only for first-time sign-up.

Keep the existing visual design (mascots, form layout, validation
styling) exactly as it is — only the underlying logic changes.
```

> This changes the role-selection screen's purpose: a one-time choice at sign-up, not something picked every login. Decide this is what you want before running the prompt.

**Model & Mode:** Spec Mode · Claude Opus 4.7 — auth + conditional routing is branching logic worth reviewing as a design doc first.

---

## Step 4 — Build the Database Schema

Run as one Spec Mode prompt so Kiro designs the schema consistently in one pass, with proper foreign keys — and so you get a `design.md` to review before anything is created.

```
Using Supabase, create tables for the following, replacing the
mock data currently hardcoded in the React app:

- profiles (id, full_name, email, phone, bio, avatar_url, role,
  member_since)
- events (id, title, organizer_id, department, date, location,
  capacity, status, created_at)
- approvals (id, event_id, status, submitted_at, reviewed_by,
  rejection_reason)
- certificates (id, event_id, student_id, template_id, issued_at,
  certificate_code)
- certificate_templates (id, name, background_image_url,
  aspect_ratio, fields JSON, created_by)
- notifications (id, user_id, message, read, created_at)

Add appropriate foreign keys between them (events.organizer_id ->
profiles.id, approvals.event_id -> events.id, etc). Do not wire
the frontend to these tables yet — this step is schema only.
```

**Model & Mode:** Spec Mode · Claude Opus 4.8 — six cross-referenced tables is a multi-file consistency problem.

> With the Supabase power installed, Kiro reads the live schema over MCP as it plans, so the design doc is checked against your actual project, not a guess.

---

## Step 5 — Row-Level Security (Real Permissions)

Turns "Guest mode disables a button" into an actually-enforced permission. RLS enforces at the database level, where it can't be bypassed from the browser.

```
Add Row-Level Security policies to every table created in the
previous step:

- Admins can read and write all rows in every table.
- Organizers can read and write only events, approvals, and
  certificates where organizer_id matches their own profile id.
  They can read (not write) their own profile only.
- Students can read events and their own certificates and
  notifications only. They cannot write to events, approvals, or
  certificate_templates at all.
- Guest sessions (unauthenticated or a guest flag on the session)
  get read-only access equivalent to whichever role they are
  previewing, with all write operations blocked at the policy
  level, not just hidden in the UI.

After adding these, test that an Organizer's Supabase client
genuinely cannot fetch another organizer's event data, even by
directly calling the query — not just that the button is hidden.
```

**Model & Mode:** Spec Mode · Claude Opus 4.7 / 4.8 — highest-stakes reasoning in this guide.

Once applied, run the Supabase power's Advisor check (Powers → Supabase → "Review security") — one-click scan for missing/overly-permissive RLS policies. Worth running before Step 6.

---

## Step 6 — Real File Storage

Certificate template backgrounds, QR photos, and profile avatars currently live as base64 in React state and localStorage. Doesn't scale, will hit browser storage limits.

```
Create three Supabase Storage buckets: certificate-templates,
qr-photos, and avatars. Update the certificate template upload
flow, the QR photo upload flow, and the profile avatar upload flow
so each one uploads the file to its corresponding bucket and
stores only the resulting public URL in the database (in
certificate_templates.background_image_url, a new events.
qr_photo_url column, and profiles.avatar_url respectively) —
instead of storing the raw base64 data. Remove the base64
storage/localStorage logic these three flows were using before.

Keep the upload UI (drag-and-drop zone, preview, replace/remove
controls) exactly as it is — only the storage mechanism changes.
```

**Model & Mode:** Spec Mode · Claude Sonnet 5 — mechanical plumbing across three flows, less branching than auth/RLS.

---

## Step 7 — Real Routing

The whole app currently navigates through one `useState<Screen>` switch in `App.tsx`. Refreshing loses your place, no shareable URLs, back button misbehaves.

```
Convert this app's screen navigation from the current
useState<Screen> pattern in App.tsx to real React Router routes.
Use a URL structure like:

  /                        -> Landing Page
  /login                   -> role selection + sign-in
  /admin/dashboard, /admin/approvals, /admin/users, etc.
  /organizer/dashboard, /organizer/events, /organizer/qr, etc.
  /student/dashboard, /student/explore, /student/certificates, etc.
  /profile

Add a route guard so admin/organizer/student routes redirect to
/login if there is no authenticated Supabase session, and redirect
a signed-in user away from their own role's routes if they try to
access a different role's URL directly. Keep all page components,
layouts, and visual behavior exactly as they are — this only
changes how navigation and URLs work.
```

**Model & Mode:** Spec Mode · Claude Sonnet 5 — bump to Opus 4.7 if the route guard needs to reason closely about the session logic from Step 3.2.

---

## Step 8 — Final Verification Checklist

- [ ] Sign up as a new user, confirm a `profiles` row is created with the correct role.
- [ ] Sign in as Admin, Organizer, and Student separately — confirm each lands on the correct dashboard automatically.
- [ ] Refresh the page mid-session — confirm you stay logged in and on the same screen.
- [ ] As an Organizer, confirm you cannot see or edit another organizer's events, even by inspecting network requests.
- [ ] As a Student, confirm write actions (approvals, template editing) are unavailable, not just visually hidden.
- [ ] Upload a certificate template background and a QR photo — confirm both are in Supabase Storage, not base64.
- [ ] Test Guest mode for all three roles — confirm every write action is actually blocked.
- [ ] Test on an actual mobile phone, not just a resized browser window.

**Model & Mode:** Vibe Mode · Claude Sonnet 5 — manual click-through, fix follow-ups with a quick Vibe prompt.

**Optional:** turn the security and storage checks into a Kiro Hook (Hooks panel → "New Hook" → trigger on push to `main`) so the Supabase Advisor scan and a build check run automatically on every push.

> Once this checklist passes, the app has moved from "prototype that looks real" to "product that behaves like one." That's the finish line for this migration.
