
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    full_name     TEXT,
    hashed_password TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'viewer',
    department    TEXT NOT NULL DEFAULT 'global',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS documents (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    doc_id              TEXT UNIQUE NOT NULL,
    filename            TEXT NOT NULL,
    file_hash           TEXT UNIQUE,
    file_type           TEXT NOT NULL,
    file_size_bytes     BIGINT NOT NULL DEFAULT 0,
    storage_path        TEXT,
    chunk_count         INT NOT NULL DEFAULT 0,
    page_count          INT NOT NULL DEFAULT 0,
    department          TEXT NOT NULL DEFAULT 'global',
    is_global           BOOLEAN NOT NULL DEFAULT FALSE,
    description         TEXT,
    tags                TEXT,
    expires_at          TIMESTAMPTZ,
    version             INT NOT NULL DEFAULT 1,
    previous_version_id TEXT REFERENCES documents(id),
    uploaded_by         TEXT REFERENCES users(id),
    upload_timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    doc_id       TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    page_num     INT NOT NULL DEFAULT 1,
    UNIQUE(doc_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_content ON document_chunks USING gin(to_tsvector('english', content));

CREATE TABLE IF NOT EXISTS conversations (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role             TEXT NOT NULL,
    content          TEXT NOT NULL,
    sources          JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id                TEXT REFERENCES users(id),
    conversation_id        TEXT,
    action                 TEXT NOT NULL,
    query_text             TEXT,
    answer_text            TEXT,
    sources_json           JSONB,
    retrieval_time_ms      FLOAT,
    generation_time_ms     FLOAT,
    total_chunks_retrieved INT,
    ip_address             TEXT,
    user_agent             TEXT,
    status                 TEXT NOT NULL DEFAULT 'success',
    error_message          TEXT,
    timestamp              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

CREATE TABLE IF NOT EXISTS verified_qas (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    department  TEXT NOT NULL DEFAULT 'global',
    created_by  TEXT REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_feeds (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title         TEXT NOT NULL,
    summary       TEXT,
    content       TEXT,
    source        TEXT NOT NULL,
    category      TEXT,
    url           TEXT,
    published_at  TIMESTAMPTZ,
    is_critical   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feeds_source ON regulatory_feeds(source);

CREATE TABLE IF NOT EXISTS feed_user_actions (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    feed_id    TEXT NOT NULL REFERENCES regulatory_feeds(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(feed_id, user_id, action)
);
