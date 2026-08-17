import { createClient } from "@supabase/supabase-js";

// Vite exposes only VITE_-prefixed env vars to client code. Both values come
// from `.env.local` at the repo root (see `.env.local.example`).
//
// The anon key is public by design — Row Level Security on the database is the
// real security boundary, not key secrecy. The service_role key must never be
// used here; it bypasses RLS and belongs only in the backend
// certificate-service.
const url: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const anonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly at module load rather than surfacing as a confusing "Invalid
  // API key" or silent auth failure on first sign-in attempt.
  throw new Error(
    "Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example to .env.local at the repo root and fill in " +
      "your project's values (Supabase dashboard -> Project Settings -> API), " +
      "then restart the dev server.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // The auth-js default is flowType: "implicit" (tokens in the URL
    // fragment). PKCE (an auth *code* in the URL query string, exchanged
    // for a session client-side) is what Supabase currently recommends for
    // browser apps doing an OAuth redirect — added here for Google sign-in
    // (see lib/auth.ts signInWithGoogle()). detectSessionInUrl: true means
    // the client detects and exchanges that code for a session on its own
    // during initialization, the moment the page loads at /auth/callback —
    // no manual exchangeCodeForSession() call needed anywhere in this app.
    // persistSession/autoRefreshToken are unchanged from the library
    // defaults; listed explicitly so all four auth options that matter for
    // this flow are visible together in one place.
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
