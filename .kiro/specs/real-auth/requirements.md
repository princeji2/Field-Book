# Requirements — Real Supabase Authentication

## Background

Sign-in across all three roles (admin, organizer, student) currently goes through a single component, `AdminLoginScreen` (`src/app/admin/login.tsx`), followed by `AdminRoleConfirmScreen` — a manual role-picker with three always-clickable cards. Neither performs any real authentication: `AdminLoginScreen.handleSubmit` does client-side field validation only, then `setTimeout(() => setPhase("success"), 1100)`. `AdminRoleConfirmScreen.triggerConfirm` routes to a role's dashboard purely because a card was clicked — it never checks who is actually signed in.

`LoginPage`/`SignupPage`/`ForgotPage` (`src/app/shared.tsx`) are a second, currently **unreachable** set of auth screens (no button anywhere navigates to them for login/signup — only `ForgotPage` is reachable, via "Forgot password?" links). They are also fake (`setTimeout`-based).

The Supabase project already has a `profiles` table (`id` FK to `auth.users.id`, `full_name`, `email`, `role` constrained to `student`/`organizer`/`admin`, `member_since`, etc.) with RLS policies live, including `profiles_insert_own` (self-insert allowed only with `role in ('student','organizer')`) and `profiles_update_own` (self-update cannot change own role). No `@supabase/supabase-js` dependency, Supabase client file, or environment variables exist anywhere in the frontend yet — this is new integration work, not a modification of existing calls.

## Scope

This spec covers replacing the fake sign-in/sign-up flow with real Supabase email/password auth, for **all three roles**, using the existing visual design as-is. It does not cover: Google sign-in (the button exists today but has no handler — stays a non-functional stub), guest mode (`isGuest`/`onGuestLogin` stay as they are — a client-only UI-disabling flag, out of scope per this request), password reset (`ForgotPage` stays fake), or route guards / URL-based routing (still the existing `useState<Screen>` pattern in `App.tsx` — no React Router migration here even though it's already a dependency).

## Requirements

### R1 — Real sign-in
1.1. `AdminLoginScreen`'s submit handler must call Supabase `auth.signInWithPassword({ email, password })` instead of the `setTimeout` fake success.
1.2. On failure (invalid credentials, unconfirmed email, network error, etc.), the form must show an inline error using the existing error-styling pattern (`emailErr`/`passErr`-style red text under the relevant field, or a form-level equivalent) — no fake "success" phase must ever be reachable from a failed sign-in.
1.3. On success, the app must fetch the signed-in user's `profiles` row (by `auth.uid()`) to read `role`, then navigate directly to that role's existing dashboard screen (`admin-dashboard` / `org-dashboard` / `dashboard`) — skipping `AdminRoleConfirmScreen` entirely for sign-in. Manual role selection must never occur for a returning, already-registered user.
1.4. If a `profiles` row does not exist for a successfully authenticated user (edge case — e.g. row creation failed at signup, or a pre-existing `auth.users` row with no profile), the app must show a clear inline error rather than silently defaulting to a role or crashing.

### R2 — Real sign-up
2.1. A sign-up entry point must exist and be reachable from the UI (today's `SignupPage` is orphaned — no button navigates to it). This spec's design must specify exactly where it becomes reachable (e.g. a link from `AdminLoginScreen`, or resurrecting `SignupPage`'s navigation).
2.2. Sign-up must collect at minimum: full name, email, password, and a role choice restricted to **Student** or **Organizer** only — Admin must not be an option anywhere in the sign-up UI, matching the DB's `profiles_insert_own` policy, which rejects `role = 'admin'` on self-insert regardless of what the client sends.
2.3. On submit, the app must call Supabase `auth.signUp({ email, password })`, then insert a row into `profiles` with `id` (the new user's `auth.uid()`), `full_name`, `role` (student or organizer, as chosen), and rely on the table's own `created_at`/`member_since` default — the app must not attempt to set `role = 'admin'` under any code path.
2.4. If Supabase email confirmation is enabled on the project (to be confirmed during design), sign-up must handle the case where `auth.signUp` succeeds but no active session is returned yet — show a clear "check your email to confirm" state rather than attempting an immediate profile insert with no authenticated session (which would fail RLS, since `profiles_insert_own` requires `auth.uid() = id`).
2.5. On successful sign-up (with an active session), the user is taken directly to their chosen role's dashboard — no manual role-confirmation step, since the role was already chosen at sign-up and stored.
2.6. Sign-up failures (duplicate email, weak password per Supabase's policy, DB insert failure after auth succeeded, etc.) must show a clear inline error, matching existing form validation styling.

### R3 — Manual role selection is retired for authentication purposes
3.1. `AdminRoleConfirmScreen` (or whatever replaces it) must no longer be reachable as a step in the sign-in flow.
3.2. The design must explicitly state what happens to `AdminRoleConfirmScreen`, `DEMO_ROLE_OPTIONS`, and the `singleRole` dead-code reference (currently an undefined variable at login.tsx ~line 491, live but unexercised) — removed, repurposed for sign-up's role choice, or left in place unused. It must not be left reachable in a way that lets a signed-in user pick a different role than their actual `profiles.role`.
3.3. Landing-page CTAs that currently call `onNavigate("admin-role-confirm")` directly (in `organizer.tsx`'s `LandingPage`) must be updated to point at the real sign-in entry point instead, so there is a real credential gate reachable from marketing/landing pages, not a bypass straight to role selection.

### R4 — Session persistence and app startup
4.1. On page load/refresh, if a real Supabase session already exists, the app should not force the user back through the login screen — it should read the existing session, fetch role, and land on the correct dashboard. (Full route guards are out of scope, but the basic "don't lose your session on refresh" behavior is in scope since it's a direct, expected consequence of adding real auth.)
4.2. Logging out (existing `onLogOut`/"Log Out" actions across admin/organizer/student shells) must call Supabase `auth.signOut()` in addition to whatever navigation it already does.

### R5 — No visual changes
5.1. Existing markup, Tailwind classes, motion/animation config, mascot component, and the Seal must not change. Only the logic inside submit handlers, `useEffect` success-transition logic, and navigation targets changes.
5.2. Loading/error states must reuse the existing `phase` state machine and error-message styling patterns already present in the component — no new visual language introduced for a "connecting to Supabase" state beyond what the current "loading" phase already shows.

### R6 — New infrastructure (explicitly greenfield)
6.1. Add `@supabase/supabase-js` as a dependency (pinned exact version, not a range).
6.2. Create a single shared Supabase client module (e.g. `src/lib/supabaseClient.ts`) used by both login and signup flows — no ad hoc client instantiation per component.
6.3. Add the frontend's Supabase URL and anon (public) key as Vite env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in a root `.env.local` (gitignored) plus a checked-in `.env.local.example` with placeholder values — mirroring the pattern already used in `certificate-service/.env.local.example`. The anon key is safe to expose client-side (RLS is the actual security boundary); the service-role key must never appear in frontend code.

## Non-goals (explicit)
- No route guards / React Router migration.
- No change to `isGuest` / guest-mode behavior.
- No real Google OAuth.
- No real password-reset flow (`ForgotPage` stays a stub).
- No changes to any RLS policy or migration — the DB side is already correct and complete.
