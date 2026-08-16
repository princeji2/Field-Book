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
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    fullName: data.full_name as string,
    email: data.email as string,
    role: data.role as AppRole,
  };
}

export type SignUpResult =
  | { status: "success"; role: SignupRole }
  | { status: "confirmation_required" }
  | { status: "error"; message: string };

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

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}
