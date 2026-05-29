-- ============================================================
-- FILE: diagnostics/schema_introspection.sql
-- PURPOSE: Schema structure, column layouts, triggers, and RLS policies
-- ============================================================


-- ------------------------------------------------------------
-- [1] Installed extensions
--
-- Lists all PostgreSQL extensions installed in the DB with their
-- version and which schema they live in.
-- Useful for confirming pgvector, pg_stat_statements, etc. are active.
-- ------------------------------------------------------------

SELECT
  e.extname AS extension_name,
  e.extversion AS version,
  n.nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY e.extname;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Table existence and active schema namespace audit
--
-- Confirms whether a core table exists and shows which schemas
-- (e.g., 'public', 'app') it is registered under. Useful for
-- verifying table creation migrations or multi-tenant namespaces.
-- ------------------------------------------------------------

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'user_assessments';

-- output example:
-- [
--   { "table_schema": "public", "table_name": "user_assessments" }
-- ]


-- ------------------------------------------------------------
-- [3] Target column migration assertion — circular_economy_tier
--
-- A precise hook to assert if a specific feature column was successfully
-- added via an ALTER TABLE migration. Returns empty if missing.
-- ------------------------------------------------------------

SELECT table_schema, column_name
FROM information_schema.columns
WHERE table_name = 'user_assessments'
  AND column_name = 'circular_economy_tier';

-- output example:
-- [
--   { "table_schema": "public", "column_name": "circular_economy_tier" }
-- ]


-- ------------------------------------------------------------
-- [4] Complete column structural sequence / ordinal positioning
--
-- Lists all columns for the target table sorted by their exact
-- physical layout order. Vital for tracking raw schema evolution
-- and diagnosing positional parameter alignment issues.
-- ------------------------------------------------------------

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_assessments'
ORDER BY ordinal_position;

-- output example:
-- [
--   { "column_name": "id" },
--   { "column_name": "user_id" },
--   { "column_name": "circular_economy_tier" }
-- ]


-- ------------------------------------------------------------
-- [5] Column type inventory for a table
--
-- Quick schema reference — all columns, types, nullability,
-- defaults, and ordinal position for a specific table.
-- ------------------------------------------------------------

SELECT
  ordinal_position AS pos,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_assessments'  -- << change table name here
ORDER BY ordinal_position;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [6] Foreign key constraints (all tables)
--
-- Maps out FK relationships — which column references which table.
-- Essential before dropping/truncating tables or changing PKs.
-- ------------------------------------------------------------

SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [7] Triggers on a specific table
--
-- Lists all triggers with the function they call, the event
-- that fires them (INSERT/UPDATE/DELETE), and timing (BEFORE/AFTER).
-- Useful when debugging unexpected side effects on writes.
-- ------------------------------------------------------------

SELECT
    trigger_name,
    event_manipulation AS event,
    action_statement AS function_call,
    action_timing AS timing
FROM information_schema.triggers
WHERE event_object_table = 'user_assessments'  -- << change table name here
ORDER BY trigger_name;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [8] All triggers across all tables
--
-- Same as above but across the entire public schema.
-- Helpful for auditing what fires on writes before a migration.
-- ------------------------------------------------------------

SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS function_call
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [9] Tables without RLS enabled (public schema)
--
-- Flags tables that have no RLS enabled at all.
-- On Supabase, any table without RLS is readable by the anon
-- and authenticated roles if the table is in public schema.
-- ------------------------------------------------------------

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [10] Row Level Security (RLS) policies
--
-- Lists all RLS policies across public tables.
-- Shows which role they apply to, the command (SELECT/INSERT/etc),
-- and the USING / WITH CHECK expressions.
-- Critical to audit before making tables publicly accessible.
-- ------------------------------------------------------------

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd AS command,
  qual AS using_expr,
  with_check AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- output example:
-- [
--
-- ]
