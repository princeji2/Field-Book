-- Field Book — automatic profile creation on signup
--
-- Part of the real-auth spec (.kiro/specs/real-auth/). Creates a
-- public.profiles row automatically whenever a new auth.users row is
-- inserted (i.e. on every signup), reading full_name/role from the
-- signup call's `options.data` metadata (auth.users.raw_user_meta_data).
--
-- This is the SOLE profile-creation mechanism for signup — not a fallback
-- alongside a client-side insert. The frontend's signUpWithProfile() never
-- inserts into profiles directly; it only passes full_name/role as signup
-- metadata. That's what makes profile creation independent of whether
-- Supabase email confirmation is enabled: auth.users gets its row (and
-- therefore triggers this function) at signup time regardless of whether
-- an active session/JWT exists yet, which a client-side insert governed by
-- profiles_insert_own's RLS check (auth.uid() = id) could not do reliably
-- in the no-session-yet case.
--
-- SECURITY DEFINER so this runs with the privileges to write to profiles
-- regardless of the calling context. Because SECURITY DEFINER bypasses RLS
-- by design, this function independently re-validates the requested role
-- itself (falling back to 'student' on anything other than an exact
-- 'student'/'organizer' match) rather than relying on profiles_insert_own's
-- check(role in ('student','organizer')) — that policy only ever governs
-- direct client-side inserts and has no bearing on what this trigger does.

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

-- on conflict (id) do nothing guards against a double-fire (e.g. any retry
-- path that re-inserts the same auth.users row) — the trigger fires on
-- auth.users insert specifically, which happens exactly once per signup
-- today, but this is cheap insurance against relying on that forever.

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
