
ALTER TABLE regulatory_feeds
    ADD COLUMN IF NOT EXISTS source_short    TEXT,
    ADD COLUMN IF NOT EXISTS severity        TEXT DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS department_tags TEXT,
    ADD COLUMN IF NOT EXISTS ai_impact       TEXT;

UPDATE regulatory_feeds SET source_short = source WHERE source_short IS NULL;

UPDATE regulatory_feeds SET severity = CASE WHEN is_critical THEN 'high' ELSE 'medium' END
WHERE severity IS NULL OR severity = 'medium';
