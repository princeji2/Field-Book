-- Field Book — security cleanup
--
-- Addresses the two remaining findings from the baseline
-- `supabase db advisors --linked --type all` run against the live project
-- (base schema applied, RLS policies migration not yet pushed):
--
--   1. anon_security_definer_function_executable /
--      authenticated_security_definer_function_executable
--        public.rls_auto_enable() is a Supabase-platform-provisioned event
--        trigger function (owner: postgres, fires on ddl_command_end via
--        the `ensure_rls` event trigger to auto-enable RLS on new public
--        tables). It is not something either migration created. It holds
--        an idle EXECUTE grant for PUBLIC (and therefore anon/authenticated
--        by inheritance) left over from its default creation grants. As an
--        event-trigger-returning function it cannot actually be invoked as
--        a normal RPC regardless of who holds EXECUTE, but the grant itself
--        is unnecessary and worth removing as defense-in-depth per the
--        Advisor's recommendation.
--
--   2. function_search_path_mutable
--        public.set_updated_at() (the updated_at trigger function from
--        20260815120000_initial_schema.sql) was created without a pinned
--        search_path, unlike the helper functions added in
--        20260816_rls_policies.sql. This re-creates it with
--        `set search_path = public` added and the function body otherwise
--        unchanged — existing triggers referencing it
--        (trg_profiles_updated_at, trg_events_updated_at,
--        trg_certificate_templates_updated_at) are unaffected by a
--        CREATE OR REPLACE FUNCTION with the same signature.
--
-- Does not touch public.rls_auto_enable()'s body, ownership, or the
-- ensure_rls event trigger itself — only its EXECUTE grants.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Revoke idle EXECUTE grants on the platform-provisioned RLS
--    auto-enable function. Left ungranted to public/anon/authenticated;
--    postgres retains ownership and implicit execute rights, and the
--    ensure_rls event trigger dispatch mechanism does not depend on these
--    grants to fire.
-- ═══════════════════════════════════════════════════════════════════════

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Pin search_path on set_updated_at(), matching the pattern already
--    used by current_profile_role()/is_admin()/is_organizer() in
--    20260816_rls_policies.sql. Body is unchanged.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
