-- ============================================================
-- AuditFlow v2 — Migration 002: Add extra columns to regulatory_feeds
-- Run this in Supabase SQL Editor if you already ran 001_initial.sql
-- ============================================================

ALTER TABLE regulatory_feeds
    ADD COLUMN IF NOT EXISTS source_short    TEXT,
    ADD COLUMN IF NOT EXISTS severity        TEXT DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS department_tags TEXT,
    ADD COLUMN IF NOT EXISTS ai_impact       TEXT;

-- Backfill source_short from source for existing rows
UPDATE regulatory_feeds SET source_short = source WHERE source_short IS NULL;

-- Backfill severity from is_critical for existing rows
UPDATE regulatory_feeds SET severity = CASE WHEN is_critical THEN 'high' ELSE 'medium' END
WHERE severity IS NULL OR severity = 'medium';
