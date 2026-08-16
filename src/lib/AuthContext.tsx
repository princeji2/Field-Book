import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUserProfile, type AuthedProfile, type AppRole } from "./auth";

// Internal 3-way UI role, matching the union App.tsx used to keep in
// `currentRole` before this migration ("admin" | "org" | "student").
export type UiRole = "admin" | "org" | "student";

export function dbRoleToUiRole(role: AppRole): UiRole {
  if (role === "admin") return "admin";
  if (role === "organizer") return "org";
  return "student";
}

interface AuthContextValue {
  /** The signed-in user's profile row, or null if not signed in. */
  profile: AuthedProfile | null;
  /** True while viewing in guest ("View Only") mode — no real session. */
  isGuest: boolean;
  /**
   * The effective role driving route access: the signed-in profile's role,
   * or the guest-selected role, or null if neither applies (no session,
   * not browsing as guest).
   */
  role: UiRole | null;
  /** True until the initial Supabase session bootstrap check resolves. */
  loading: boolean;
  /** Called by the login/signup screens right after a successful sign-in. */
  setAuthenticated: (p: AuthedProfile) => void;
  /** Enters guest ("View Only") mode as the given role. */
  loginAsGuest: (role: UiRole) => void;
  /** Clears local session state (real profile and/or guest mode). */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthedProfile | null>(null);
  const [guestRole, setGuestRole] = useState<UiRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Session bootstrap: on mount, check for an existing Supabase session so a
  // page refresh doesn't bounce an already-authenticated user back to
  // /login. Mirrors the effect that used to live in App.tsx.
  useEffect(() => {
    (async () => {
      const fetched = await getCurrentUserProfile();
      if (fetched) setProfile(fetched);
      setLoading(false);
    })();
  }, []);

  const isGuest = guestRole !== null;
  const role: UiRole | null = profile ? dbRoleToUiRole(profile.role) : guestRole;

  function setAuthenticated(p: AuthedProfile) {
    setGuestRole(null);
    setProfile(p);
  }

  function loginAsGuest(r: UiRole) {
    setProfile(null);
    setGuestRole(r);
  }

  function clearSession() {
    setProfile(null);
    setGuestRole(null);
  }

  return (
    <AuthContext.Provider
      value={{ profile, isGuest, role, loading, setAuthenticated, loginAsGuest, clearSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used within an AuthProvider");
  return ctx;
}
