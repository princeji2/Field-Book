import { supabase } from "./supabaseClient";
import type { Screen } from "../app/shared";

// Roles as stored in public.profiles.role (lowercase, per the DB check
// constraint: 'student' | 'organizer' | 'admin').
export type AppRole = "student" | "organizer" | "admin";

// Roles a user is allowed to choose for themselves at sign-up. 'admin' is
// deliberately absent: the profiles_insert_own RLS policy rejects a
// self-inserted admin row, and public.handle_new_user() (the signup trigger)
// falls back to 'student' for anything that isn't exactly 'student' or
// 'organizer'. Encoding that here keeps the frontend from even being able to
// ask.
export type SignupRole = Extract<AppRole, "student" | "organizer">;

export interface AuthedProfile {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  avatarUrl: string | null;
}

/** Maps a profile role to that role's existing dashboard screen. */
export function roleToScreen(role: AppRole): Screen {
  if (role === "admin") return "admin-dashboard";
  if (role === "organizer") return "org-dashboard";
  return "dashboard";
}

/**
 * Signs in with email/password. Callers should check the returned `error` and
 * then separately call getCurrentUserProfile(), so "bad credentials" and
 * "authenticated but no profile row" can be reported as different messages.
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Reads the current session's profile row. Returns null when there is no
 * session, or when the authenticated user has no matching profiles row (a
 * genuine edge case now that profile creation is handled by the
 * on_auth_user_created trigger — e.g. a row deleted out-of-band).
 */
export async function getCurrentUserProfile(): Promise<AuthedProfile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    fullName: data.full_name as string,
    email: data.email as string,
    role: data.role as AppRole,
    avatarUrl: (data.avatar_url as string | null) ?? null,
  };
}

/**
 * Updates the calling user's own avatar_url. Gated by profiles_update_own
 * (auth.uid() = id) — a user can only ever update their own row this way.
 * Pass null to clear the avatar (matches the "Remove photo" UI action).
 */
export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<{ status: "success" } | { status: "error"; message: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) return { status: "error", message: error.message };
  return { status: "success" };
}

export type SignUpResult =
  | { status: "success"; role: SignupRole }
  | { status: "confirmation_required" }
  | { status: "error"; message: string };

/**
 * Maps Supabase Auth error codes to copy safe to show end users, instead of
 * forwarding raw API error strings verbatim (see the OTP-verify/resend UI in
 * SignupPage, and the "email rate limit exceeded" issue this replaces for
 * the signup email step specifically). Falls back to a generic message for
 * any code not explicitly handled here, rather than ever surfacing internal
 * wording like "otp_expired" or a raw network error to the UI.
 *
 * Error codes per https://supabase.com/docs/guides/auth/debugging/error-codes
 */
function otpErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case "otp_expired":
      return "That code has expired. Request a new one below.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a moment before trying again.";
    case "validation_failed":
      return "Enter the 6-digit code exactly as sent.";
    case "user_not_found":
      return "We couldn't find a pending signup for this email. Try signing up again.";
    default:
      // Covers "Token has expired or is invalid" (wrong code) and any
      // other error the SDK returns without a specific `code` we handle
      // above — deliberately generic so nothing internal leaks through.
      return "That code didn't work. Double-check it and try again, or request a new one.";
  }
}

/**
 * Creates an auth user, passing full_name/role as signup metadata.
 *
 * There is intentionally NO client-side insert into `profiles` here: the
 * public.handle_new_user() trigger on auth.users reads this metadata and
 * creates the profiles row server-side, on every signup, whether or not email
 * confirmation is enabled. That's what makes profile creation independent of
 * session timing — a browser-side insert would fail profiles_insert_own's
 * `auth.uid() = id` check when signUp returns no session.
 */
export async function signUpWithProfile(opts: {
  email: string;
  password: string;
  fullName: string;
  role: SignupRole;
}): Promise<SignUpResult> {
  const { email, password, fullName, role } = opts;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });

  if (error) return { status: "error", message: error.message };

  if (!data.session) {
    // Email confirmation is enabled. The auth.users row (and therefore the
    // profiles row, via the trigger) already exists — the user simply can't
    // sign in until they confirm.
    return { status: "confirmation_required" };
  }

  return { status: "success", role };
}

export type VerifySignupOtpResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Verifies the 6-digit code sent to a newly-signed-up user's email.
 *
 * type: "signup" tells Supabase Auth this OTP belongs to the pending signup
 * confirmation flow (as opposed to "email" for a generic passwordless
 * email-OTP sign-in, or "recovery" for password reset) — see
 * EmailOtpType in @supabase/auth-js. On success this both confirms the
 * user's email server-side and returns an active session, since Supabase
 * treats a correct signup OTP the same as clicking the confirmation link:
 * data.session comes back populated, so no separate sign-in call is needed
 * after this resolves.
 */
export async function verifySignupOtp(email: string, token: string): Promise<VerifySignupOtpResult> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { status: "error", message: otpErrorMessage(error) };
  return { status: "success" };
}

export type ResendSignupOtpResult =
  | { status: "success" }
  | { status: "error"; message: string };

/** Requests a fresh 6-digit signup code for an email with a pending, unconfirmed signup. */
export async function resendSignupOtp(email: string): Promise<ResendSignupOtpResult> {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { status: "error", message: otpErrorMessage(error) };
  return { status: "success" };
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Starts the Google OAuth flow via Supabase Auth. This causes a full-page
 * redirect to Google's account picker (window.location.assign under the
 * hood, see supabase-js's signInWithOAuth) — there is no session yet by the
 * time this promise resolves; it only resolves with an error if the redirect
 * itself couldn't be initiated (e.g. Google provider not enabled in the
 * Supabase dashboard, or a network failure).
 *
 * Google redirects the user back to /auth/callback with a PKCE auth code in
 * the URL. supabaseClient.ts is configured with flowType: "pkce" and
 * detectSessionInUrl: true, so the client library exchanges that code for a
 * session automatically on page load — no exchangeCodeForSession() call is
 * needed in this codebase. See AuthCallbackRoute.tsx for how the callback
 * page waits for that exchange to finish (via useAuth()'s existing
 * loading/role bootstrap) before routing the user into the app.
 *
 * Both the sign-in and sign-up "Continue with Google" buttons call this same
 * function: Supabase Auth doesn't distinguish "sign up" from "sign in" for
 * OAuth providers — a first-time Google sign-in creates the auth.users row
 * (and, via the on_auth_user_created trigger, a profiles row defaulted to
 * role 'student') exactly as a returning user's sign-in reuses it.
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}
