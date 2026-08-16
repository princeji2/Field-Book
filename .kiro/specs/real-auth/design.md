# Design — Real Supabase Authentication

## Files touched (confirmed against actual current code)

| File | Change |
|---|---|
| `package.json` | add `@supabase/supabase-js` (pinned exact version) |
| `.env.local` (new, gitignored) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `.env.local.example` (new, checked in) | same keys, placeholder values |
| `src/lib/supabaseClient.ts` (new) | single shared client instance |
| `src/lib/auth.ts` (new) | `signIn`, `signUpWithProfile`, `getCurrentUserProfile`, `signOutUser`, `roleToScreen` |
| `src/app/admin/login.tsx` | `AdminLoginScreen`: real sign-in, error state, role-based post-login navigation, new "Create account" link. `AdminRoleConfirmScreen`: **unchanged** — kept only as the guest-mode preview picker (see below). |
| `src/app/shared.tsx` | `SignupPage`: add Student/Organizer choice, real sign-up + profile insert, handle email-confirmation case, route to correct dashboard. `LoginPage`: **left as-is, still orphaned** (see "Explicitly not touching" below). |
| `src/app/App.tsx` | bootstrap existing session on mount; wire `signOut()` into logout handlers; `navigateTo`'s admin-login-clears-guest logic unchanged. |
| `src/app/organizer.tsx` | `LandingPage`'s 3 CTAs: `onNavigate("admin-role-confirm")` → `onNavigate("admin-login")`. |

Not touched: `AdminAppShell`/`shell.tsx` (only the `onLogOut` callback passed in gets a `signOut()` call added at each call site, not the shell itself), any admin/organizer/student dashboard screen, any visual/motion code, `ForgotPage`, Google sign-in stub, `isGuest`/guest-mode logic, RLS policies/migrations.

## Why `AdminRoleConfirmScreen` stays, unmodified

Requirement R3 asks that manual role-selection be retired *as a sign-in step*, but investigation surfaced a real dependency: guest mode's `handleGuestLogin` in `App.tsx` reads `pendingRole` — state that is **only** ever set by `AdminRoleConfirmScreen.triggerConfirm` calling `onRoleSelect`. `AdminLoginScreen`'s own "Continue as Guest" button calls `onGuestLogin` directly, without going through role-confirm, so today it silently uses whatever `pendingRole` last was (defaulting to `"admin"`).

Guest mode is explicitly a non-goal here ("No change to `isGuest`/guest-mode behavior"). Removing or repurposing `AdminRoleConfirmScreen` would either break that guest-preview picker or require redesigning it — out of scope. So the design keeps `AdminRoleConfirmScreen` byte-for-byte as-is, including its existing `"Change role"` entry point at the bottom of `AdminLoginScreen`, and including the pre-existing `singleRole` dead-code reference (undefined variable, currently unexercised since `roles.length` is always 3) — not fixing an unrelated bug as a side effect of this change. What changes is only that **real, authenticated sign-in no longer routes through it**: `AdminLoginScreen`'s success path now goes straight to the role-specific dashboard based on the fetched `profiles.role`, bypassing role-confirm entirely. Role-confirm remains reachable only via the "Change role" link (functionally now a "preview a different role as guest" affordance) — which is consistent with its current disconnect from real identity today.

## Why Signup lives in `SignupPage` (`shared.tsx`), not a new component

`SignupPage` already exists, already collects `name`/`email`/`password`/`confirm`/`terms`, and its "Already have an account? Sign in" link already correctly calls `onNavigate("admin-login")` (only its inbound link is currently missing — nothing today calls `onNavigate("signup")`). Reusing it means: no new visual component, all existing validation/styling/motion stays. Two additions are unavoidable to satisfy R2.2 (role must be chosen at signup, restricted to student/organizer):

1. A "Create account" text link added to `AdminLoginScreen`, calling `onNavigate("signup")` — same visual treatment as the existing "Forgot password?" link directly below it (same `text-[11px] text-[#6B6355]` pattern, just a second line).
2. A two-option role choice inside `SignupPage`, rendered using the **existing Secondary button style** already defined in the design system (`border border-[#1E1B16]/25 rounded-[7px]`, toggling to filled/primary styling when selected) rather than introducing the larger animated 3-card component from `AdminRoleConfirmScreen` — that component is heavier (spring animation, absolute-positioned progress bar, hover lift) and built for a different context (post-auth demo picker). Two simple toggle buttons using tokens already in `Guidelines.md` is the smaller, more consistent addition. Labeled "I'm a Student" / "I'm an Organizer" — no "Admin" option exists anywhere in this UI, matching the DB constraint.

`LoginPage` (`shared.tsx`) is explicitly left untouched and still orphaned. It's a second, redundant, currently-unreachable fake login form that duplicates `AdminLoginScreen`. Wiring it up or deleting it is real cleanup work outside what was asked (replace the *reachable* fake flow with a real one) — flagging it here so it's a visible, deliberate decision rather than an oversight, not silently fixing it.

## `src/lib/supabaseClient.ts`

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check .env.local (see .env.local.example)."
  );
}

export const supabase = createClient(url, anonKey);
```

## `src/lib/auth.ts`

Centralizes every Supabase auth/profile call so `AdminLoginScreen` and `SignupPage` don't duplicate query logic.

```ts
import { supabase } from "./supabaseClient";
import type { Screen } from "../app/shared";

export type AppRole = "student" | "organizer" | "admin";

export interface AuthedProfile {
  id: string;
  fullName: string;
  role: AppRole;
}

export function roleToScreen(role: AppRole): Screen {
  if (role === "admin") return "admin-dashboard";
  if (role === "organizer") return "org-dashboard";
  return "dashboard";
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
  // Caller checks `error`; on success, caller fetches the profile separately
  // via getCurrentUserProfile so the two failure modes (bad credentials vs.
  // missing profile row) can be told apart and messaged differently (R1.2 vs R1.4).
}

export async function getCurrentUserProfile(): Promise<AuthedProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null; // R1.4 — authenticated but no profile row
  return { id: data.id, fullName: data.full_name, role: data.role as AppRole };
}

export async function signUpWithProfile(opts: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "organizer"; // admin intentionally not accepted by this function's type
}) {
  const { email, password, fullName, role } = opts;

  // No direct `profiles` insert here. full_name/role are passed as auth
  // user metadata (`options.data`); a SECURITY DEFINER trigger on
  // `auth.users` (see the new migration) reads that metadata and creates
  // the `profiles` row server-side, on every signup, regardless of
  // whether email confirmation is required — see "Profile creation via
  // trigger" below. This sidesteps the RLS-timing problem entirely: no
  // client-side insert ever races an unconfirmed/sessionless signup.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });
  if (error) return { status: "error" as const, message: error.message };

  if (!data.session) {
    // Email confirmation required. auth.users row (and therefore the
    // profiles row, via the trigger) already exists at this point — the
    // user just can't sign in yet until they confirm.
    return { status: "confirmation_required" as const };
  }

  return { status: "success" as const, role };
}

export async function signOutUser() {
  await supabase.auth.signOut();
}
```

### Profile creation via trigger — decided: trigger is the only path, unconditionally

Per explicit decision: a `SECURITY DEFINER` trigger on `auth.users` creates the `profiles` row on every signup, regardless of email-confirmation timing — not a fallback for the no-session case, the *sole* mechanism. This is a new migration, `supabase/migrations/<timestamp>_profile_creation_trigger.sql`:

```sql
-- Creates a profiles row automatically whenever a new auth.users row is
-- inserted (i.e. on every signup), reading full_name/role from the
-- signup call's `options.data` metadata (auth.users.raw_user_meta_data).
-- SECURITY DEFINER so it runs with the privileges to write to profiles
-- regardless of whether the new user has an active session yet — this is
-- what makes profile creation independent of email-confirmation timing.
--
-- Defends against a malicious/malformed metadata payload requesting
-- role = 'admin': falls back to 'student' if the metadata role isn't
-- exactly 'student' or 'organizer'. This is a second, independent
-- enforcement point alongside the profiles_insert_own RLS policy — the
-- RLS policy protects direct client inserts; this trigger protects the
-- server-side path RLS does not gate at all (SECURITY DEFINER bypasses
-- RLS by design).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role text;
begin
  safe_role := case
    when requested_role in ('student', 'organizer') then requested_role
    else 'student'
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    safe_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`on conflict (id) do nothing` guards against a double-fire (e.g. Supabase resending a confirmation triggering another insert) — the trigger fires on `auth.users` insert specifically, which happens exactly once per signup, but this is cheap insurance against relying on that assumption forever.

This function lives in `auth`-adjacent territory but is defined in `public` per Supabase convention (functions triggered on `auth.users` are commonly created in `public`, since `auth` schema objects are managed by Supabase itself and user-defined functions shouldn't be added there). No changes to the existing `profiles_insert_own`/`profiles_update_own` RLS policies — they still fully apply to any *direct* client-side insert/update attempt; this trigger is a separate, additional write path that bypasses RLS by design (that's what `SECURITY DEFINER` is for), scoped narrowly to "create exactly one profile row at signup, only choosing between student/organizer."

Since profile creation no longer depends on an active session, `signUpWithProfile` never performs a client-side `profiles` insert at all — see the updated function above. `getCurrentUserProfile()`'s R1.4 "no profile row found" path becomes purely a genuine-edge-case guard (e.g. an operator manually deleting a profiles row) rather than an expected outcome of the email-confirmation flow.

## `AdminLoginScreen` changes (`src/app/admin/login.tsx`)

- New state: `authErr: string` (form-level error, separate from field-level `emailErr`/`passErr`) — rendered using the exact same `text-[10px] text-[#B5432E]` pattern already used for field errors, placed above the submit button.
- `handleSubmit` becomes `async`. Field validation stays identical (same regex, same required checks). On passing validation:
  ```ts
  setPhase("loading");
  const { error } = await signIn(email, password);
  if (error) {
    setAuthErr(error.message);
    setPhase("idle");
    return;
  }
  const profile = await getCurrentUserProfile();
  if (!profile) {
    setAuthErr("We couldn't find an account profile for this login. Contact an administrator.");
    setPhase("idle");
    return;
  }
  setResolvedScreen(roleToScreen(profile.role)); // new state, read by the success useEffect
  setPhase("success");
  ```
- The existing `useEffect` on `phase === "success"` changes its target from the hardcoded `onNavigate("admin-role-confirm")` to `onNavigate(resolvedScreen)` — same 1600ms delay, same visual transition, just a different destination screen.
- New link under the existing "Forgot password?" button: `Don't have an account? Create one` → `onNavigate("signup")`.

## `SignupPage` changes (`src/app/shared.tsx`)

- New state: `role: "student" | "organizer" | null` (must be chosen before submit — validation error if left null, same red-text pattern as other field errors).
- Two toggle buttons rendered above or below the existing name/email/password fields (exact placement is an implementation detail, not a requirements change) using the Secondary button token, switching to Primary (marigold) styling when selected — no new color, no new radius, no new motion pattern.
- `handleSubmit` becomes `async`, calls `signUpWithProfile({ email, password, fullName: name, role })`:
  - `status === "error"` → show message via existing error-styling, stay on form.
  - `status === "confirmation_required"` → reuse the existing "success" panel visual (same motion/Seal treatment as the current fake success state), but with copy changed to "Check your email to confirm your account before signing in" instead of navigating anywhere — no dashboard to send them to yet since there's no session.
  - `status === "success"` → same success panel, then navigate to `roleToScreen(role)` after the existing delay, same as today's `onNavigate("dashboard")` timing but role-aware instead of hardcoded.

## `App.tsx` changes

- New effect on mount:
  ```ts
  useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setCurrentRole(profile.role === "admin" ? "admin" : profile.role === "organizer" ? "org" : "student");
        setScreen(roleToScreen(profile.role));
      }
    })();
  }, []);
  ```
  If no session exists, `getCurrentUserProfile()` resolves `null` and the app falls through to its current default (`"landing"`) — unchanged behavior for a logged-out visitor.
- Every existing `onLogOut={() => onNavigate("admin-login")}` / `onNavigate?.("landing")` call site gets `await signOutUser();` added immediately before the existing `onNavigate` call — same navigation targets as today, just also actually clearing the Supabase session. This touches call sites in `admin/shell.tsx` usage (via the `onLogOut` prop passed from `App.tsx`), and organizer/student's header dropdown logout actions — exact call sites to be enumerated in tasks.md once confirmed by re-reading `shell.tsx`/`organizer.tsx`'s header code (not yet read in full — investigation so far covered login/signup/routing files specifically, not every shell's logout button).

## `organizer.tsx` `LandingPage` change

Three CTAs (`nav "Sign in"`, hero "Get Started", footer CTA) currently call `onNavigate("admin-role-confirm")`. All three become `onNavigate("admin-login")` — the real credential gate, matching R3.3. No visual change to the buttons themselves.

## Env files

`.env.local.example` (checked in):
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
`.env.local` (gitignored, real values — you'll need to supply your project's actual URL/anon key; I have neither in front of me and won't fabricate placeholders into the real file).

## Decisions (resolved)

1. **Profile creation trigger:** in scope for this spec, as the sole profile-creation mechanism (see "Profile creation via trigger" above) — not a fallback alongside a client-side insert.
2. **`.env.local` real values:** user will supply directly; not looked up via CLI/dashboard as part of this task.
3. **`LoginPage`:** removed from `shared.tsx` as dead code (see below). `SignupPage` is kept and wired up — it is not equally orphaned once R2 is implemented; it's the real signup UI going forward.
4. **`singleRole` dead-code bug in `AdminRoleConfirmScreen`:** left untouched, confirmed out of scope.

## `LoginPage` removal (`src/app/shared.tsx`)

`LoginPage` is unreachable dead code today (confirmed: no call site anywhere sets `screen` to `"login"`) and is being deleted, not just left alone. Scope of the removal:
- Delete the `LoginPage` function itself from `shared.tsx`.
- Remove `"login"` from the `Screen` type union.
- Remove the `case "login":` branch (or equivalent conditional) from `App.tsx`'s screen-rendering switch.
- Check for and remove any now-dead imports in `shared.tsx`/`App.tsx` that existed only to support `LoginPage`.
- `getPasswordScore`/`StrengthMeter` (currently shared between `LoginPage` and `SignupPage` per investigation) must be kept — `SignupPage` still uses them.
- Not removing: `"signup"` or `"forgot"` from `Screen`, `SignupPage`, `ForgotPage`, or anything else — only `LoginPage` and its exclusive references.
