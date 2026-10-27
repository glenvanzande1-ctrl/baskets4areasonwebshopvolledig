-- Phase 16.3: defense-in-depth security for Supabase / PostgreSQL.
--
-- The application accesses PostgreSQL server-side through Prisma.
-- Browser clients must not be able to access the application tables directly
-- through Supabase's anon/authenticated roles.
--
-- IMPORTANT: We intentionally use ENABLE ROW LEVEL SECURITY, not FORCE ROW LEVEL SECURITY.
-- The database owner / Prisma server connection therefore keeps working normally.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$$;

-- Supabase-specific hardening. These roles do not exist in a plain local
-- PostgreSQL installation, so only apply these revokes when the roles exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE USAGE ON SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
    REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON SEQUENCES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON FUNCTIONS FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE USAGE ON SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON SEQUENCES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      REVOKE ALL ON FUNCTIONS FROM authenticated;
  END IF;
END
$$;

-- No RLS policies are created on purpose.
-- Result: Supabase anon/authenticated users have no direct access to public tables.
-- Prisma continues to use the server-side PostgreSQL connection.
