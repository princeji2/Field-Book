# Tasks — Real Supabase Authentication

Reflects the decisions in design.md: trigger-based profile creation (sole mechanism, not a fallback), user-supplied `.env.local` values, `LoginPage` deleted, `SignupPage` kept and wired up, `singleRole` bug left untouched.

## 1. Database: profile-creation trigger migration
- [ ] 1.1 Create `supabase/migrations/<timestamp>_profile_creation_trigger.sql` with `public.handle_new_user()` (`SECURITY DEFINER`, `set search_path = public`, role fallback to `'student'` if metadata role isn't exactly `student`/`organizer`) and the `on_auth_user_created` trigger on `auth.users`, exactly as specified in design.md.
- [ ] 1.2 Show the migration file for review (do not apply yet) — same review-before-apply pattern used for the earlier RLS/security-cleanup migrations.
- [ ] 1.3 On approval: dry-run (`supabase db push --linked --dry-run`), then apply, then verify — query `pg_trigger`/`pg_proc` to confirm the trigger and function exist and are enabled, matching how prior migrations were verified in this project.

## 2. Frontend: Supabase client infrastructure
- [ ] 2.1 Add `@supabase/supabase-js` to `package.json` (pinned exact version — check latest stable via npm before pinning, not guessed).
- [ ] 2.2 Create `.env.local.example` at repo root with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` placeholders, mirroring `certificate-service/.env.local.example`'s pattern.
- [ ] 2.3 Confirm `.env.local` is covered by the root `.gitignore` (check, don't assume); add an entry if it's missing.
- [ ] 2.4 Wait for user-supplied real values in `.env.local` before any task that requires a working Supabase connection (2.6 onward) — do not fabricate placeholder credentials into the real file.
- [ ] 2.5 Create `src/lib/supabaseClient.ts` per design.md (throws a clear error if env vars are missing, rather than failing silently later).
- [ ] 2.6 Create `src/lib/auth.ts` per design.md: `roleToScreen`, `signIn`, `getCurrentUserProfile`, `signUpWithProfile` (metadata-only signup, no client-side profile insert), `signOutUser`.

## 3. `AdminLoginScreen` — real sign-in
- [ ] 3.1 Add `authErr` state and its rendering (form-level error, same `text-[10px] text-[#B5432E]` styling already used for field errors).
- [ ] 3.2 Add `resolvedScreen` state, set on successful role fetch, consumed by the existing success `useEffect`.
- [ ] 3.3 Convert `handleSubmit` to `async`; keep existing field validation identical; replace the `setTimeout` fake-success call with `signIn` → `getCurrentUserProfile` → set `resolvedScreen` → `setPhase("success")`, per design.md's exact flow (including the R1.4 "no profile row" inline error path).
- [ ] 3.4 Update the success-phase `useEffect` to navigate to `resolvedScreen` instead of the hardcoded `"admin-role-confirm"`.
- [ ] 3.5 Add "Don't have an account? Create one" link below the existing "Forgot password?" link, calling `onNavigate("signup")`. Same visual treatment (`text-[11px] text-[#6B6355]` pattern).
- [ ] 3.6 Leave `AdminRoleConfirmScreen`, `DEMO_ROLE_OPTIONS`, and the `singleRole` reference completely unmodified, per the confirmed decision.

## 4. `SignupPage` — real sign-up, wired up
- [ ] 4.1 Add `role: "student" | "organizer" | null` state and its validation (error if unset on submit, same red-text pattern as other fields).
- [ ] 4.2 Add the two-option role toggle UI (Secondary/Primary button tokens per design.md — no new colors, radii, or motion patterns). No "Admin" option anywhere in this component.
- [ ] 4.3 Convert `handleSubmit` to `async`; keep existing field validation (password length, confirm-match, terms checkbox) identical; call `signUpWithProfile({ email, password, fullName: name, role })`.
- [ ] 4.4 Handle all three `signUpWithProfile` outcomes: `error` (inline message, stay on form), `confirmation_required` (reuse existing success-panel visual/motion, copy changed to a "check your email" message, no navigation), `success` (existing success panel, then `onNavigate(roleToScreen(role))` after the existing delay).
- [ ] 4.5 Confirm the existing "Already have an account? Sign in" link's target (`onNavigate("admin-login")`) still makes sense post-changes — no change expected, just a check.

## 5. Retire `LoginPage`, keep everything else in `shared.tsx`
- [ ] 5.1 Delete the `LoginPage` function from `shared.tsx`.
- [ ] 5.2 Remove `"login"` from the `Screen` type union.
- [ ] 5.3 Remove the `case "login"` (or equivalent) render branch from `App.tsx`.
- [ ] 5.4 Grep for any remaining references to `LoginPage` or `onNavigate("login")` across `src/app/**` and remove them.
- [ ] 5.5 Confirm `getPasswordScore`/`StrengthMeter` are still used by `SignupPage` after the deletion (keep them) — verify no other now-dead helper was exclusive to `LoginPage`.
- [ ] 5.6 Leave `SignupPage`, `ForgotPage`, and the `Screen` values `"signup"`/`"forgot"` untouched structurally (beyond the role-toggle addition in task 4).

## 6. `App.tsx` — session bootstrap and sign-out wiring
- [ ] 6.1 Add the on-mount session-check effect per design.md: call `getCurrentUserProfile()`, and if a profile is found, set `currentRole` and `screen` accordingly; otherwise fall through to existing default behavior unchanged.
- [ ] 6.2 Read `admin/shell.tsx` and `organizer.tsx`'s header/shell logout code in full (not yet read line-by-line in this investigation) to enumerate every actual `onLogOut`/"Log Out" call site precisely.
- [ ] 6.3 Add `await signOutUser();` immediately before the existing `onNavigate(...)` call at each enumerated logout call site — no change to navigation targets or the existing admin logout confirmation modal.

## 7. `organizer.tsx` — landing page CTA fix
- [ ] 7.1 Change the 3 `LandingPage` CTAs (`nav "Sign in"`, hero "Get Started", footer CTA) from `onNavigate("admin-role-confirm")` to `onNavigate("admin-login")`. No visual change.

## 8. Verification
- [ ] 8.1 Run the project's build (`vite build` per `package.json`'s `build` script) and fix any TypeScript/build errors before presenting the result.
- [ ] 8.2 Manual smoke test checklist (report which of these were actually exercised vs. not, don't claim untested paths passed):
  - [ ] Sign up as a new Student → lands on student dashboard (or confirmation-required message, depending on the live project's email-confirmation setting).
  - [ ] Sign up as a new Organizer → lands on organizer dashboard.
  - [ ] Attempt sign-up with a duplicate email → inline error shown, no crash.
  - [ ] Sign in as each of the three existing roles (if seed/test users exist) → lands directly on the correct dashboard, no role-confirm screen shown.
  - [ ] Sign in with wrong password → inline error shown, form stays usable.
  - [ ] Refresh the page while signed in → session persists, lands on correct dashboard, not bounced to login.
  - [ ] Log out from admin, organizer, and student shells → each actually clears the Supabase session (check via `supabase.auth.getSession()` in devtools or by confirming a refresh afterward returns to logged-out state), not just a navigation change.
  - [ ] Confirm `profiles` row appears in the `profiles` table (via `db query --linked`) after a real sign-up, with the correct `role` and never `'admin'`.
  - [ ] Confirm landing page CTAs land on the real sign-in form, not the role-picker.
- [ ] 8.3 Confirm no regressions to visual design — spot check `AdminLoginScreen`/`SignupPage` render identically to before aside from the new error states and role toggle.

## Explicit non-tasks (carried over from requirements.md non-goals)
- No React Router / route guard work.
- No changes to `isGuest`/guest-mode logic beyond what's already unavoidable (none identified).
- No real Google OAuth wiring.
- No real password-reset (`ForgotPage` stays a stub).
- No changes to existing RLS policies (`profiles_insert_own`/`profiles_update_own` etc.) — only the new trigger migration in task 1.
