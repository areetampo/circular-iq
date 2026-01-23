-- Migration: Fix RLS policies for assessments table (MVP Phase)
-- ============================================
-- Date: 2026-01-23
-- Purpose: Allow unrestricted access to assessments for MVP phase
--          Real authentication will be implemented in Phase 3
-- ============================================

-- Drop existing overly-restrictive policies
DROP POLICY IF EXISTS assessments_read_own ON assessments;
DROP POLICY IF EXISTS assessments_write_own ON assessments;

-- New permissive policies for MVP
-- These allow all operations without RLS restrictions
-- (Real auth + RLS will be added in Phase 3)

CREATE POLICY assessments_read ON assessments
  FOR SELECT
  USING (TRUE);

CREATE POLICY assessments_insert ON assessments
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY assessments_update ON assessments
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY assessments_delete ON assessments
  FOR DELETE
  USING (TRUE);

-- Verify policies are in place
-- Run this query to check: SELECT * FROM pg_policies WHERE tablename = 'assessments';
