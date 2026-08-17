import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router";
import { RefreshCw } from "lucide-react";
import { F, dotGrid } from "../shared";
import { useAuth } from "../../lib/AuthContext";
import { roleHome } from "../../lib/screenPaths";

/**
 * "/auth/callback" — where Google (via Supabase) redirects back to after
 * signInWithGoogle() (see lib/auth.ts). This is a real browser navigation
 * (not a client-side route change), so the whole SPA reloads fresh here,
 * same as any other first-load URL.
 *
 * There's no manual code-exchange step to write: supabaseClient.ts has
 * flowType: "pkce" and detectSessionInUrl: true, so the Supabase client
 * exchanges the ?code=... in this URL for a session automatically as part
 * of its own initialization, before AuthProvider's bootstrap effect
 * (getCurrentUserProfile() -> supabase.auth.getSession()) resolves — that
 * effect already awaits the same internal `initializePromise` the code
 * exchange runs in, so `profile`/`role` come back populated with no new
 * plumbing needed. This route just waits on the existing `loading` flag
 * (identical to RoleGuard/AuthRouteGuard) and then routes by role, or shows
 * an error state if the sign-in didn't produce a session.
 */
export function AuthCallbackRoute() {
  const { role, loading } = useAuth();
  const [params] = useSearchParams();

  // Present only on failure — a successful PKCE exchange strips ?code= (and
  // any Supabase-added params) from the URL via history.replaceState before
  // this component would ever see it. See Google's OAuth error codes:
  // https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors
  const oauthError = params.get("error_description") || params.get("error");

  useEffect(() => {
    if (oauthError) console.error("[AuthCallbackRoute] Google sign-in error:", oauthError);
  }, [oauthError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center px-6" style={dotGrid}>
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw size={20} className="text-[#6B6355] animate-spin" strokeWidth={1.5} />
          <p className="text-[12px] text-[#6B6355]" style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
            Finishing sign-in…
          </p>
        </div>
      </div>
    );
  }

  if (role) return <Navigate to={roleHome(role)} replace />;

  // No session and no in-flight bootstrap: either the user cancelled the
  // Google consent screen, the Google provider isn't enabled/configured in
  // the Supabase dashboard yet, or the PKCE code exchange failed (e.g. a
  // redirect URI mismatch surfaces here too, since Supabase's own callback
  // redirects to this page with an error param rather than a code).
  return (
    <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center px-6 py-12" style={dotGrid}>
      <div className="w-full max-w-[380px] bg-[#FCFAF3] border border-[#DCD4C2] rounded-[8px] px-7 py-8 text-center">
        <h1 className="text-[1.1rem] font-semibold text-[#1E1B16] mb-2" style={F}>
          Sign-in didn't go through.
        </h1>
        <p className="text-[12px] text-[#6B6355] mb-5"
          style={{ fontFamily: "'Public Sans',system-ui,sans-serif" }}>
          {oauthError || "Something interrupted the Google sign-in. You can try again."}
        </p>
        <a href="/login"
          className="inline-flex items-center justify-center px-6 py-[10px] rounded-[7px] text-[12px] font-semibold bg-[#1E1B16] text-[#F6F1E7] hover:bg-[#2E2A24] transition-colors"
          style={{ fontFamily:"'Public Sans',system-ui,sans-serif" }}>
          Back to sign-in
        </a>
      </div>
    </div>
  );
}
