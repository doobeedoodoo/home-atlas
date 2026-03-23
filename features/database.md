# Feature: Database Schema

## Overview

PostgreSQL 16 with pgvector extension. All schema changes via Knex migrations. Row-level isolation enforced at the application query layer.

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;        -- pgvector
```

---

## Full Schema

```sql
-- ============================================================
-- Users
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Documents (PDF files)
-- ============================================================
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  r2_key          TEXT UNIQUE,               -- e.g. docs/{userId}/{docId}.pdf; NULL for URL-sourced docs
  source_url      TEXT,                      -- Phase 2: set for URL-ingested docs; NULL for file uploads
  file_size_bytes BIGINT,                    -- NULL for URL-sourced docs (unknown until scrape completes)
  mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','ready','failed')),
  error_message   TEXT,
  page_count      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Exactly one of r2_key or source_url must be set per row.
-- Enforced at the application layer (Zod + route logic).
CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX documents_status_idx  ON documents(status);

-- ============================================================
-- Document Chunks (vector embeddings)
-- ============================================================
CREATE TABLE DocumentChunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  page_number  INTEGER,
  content      TEXT NOT NULL,
  embedding    vector(1536),
  token_count  INTEGER,
  metadata     JSONB,                        -- e.g. { "section": "Installation", "pageTitle": "Samsung TV Support" }
  content_tsv  TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);
CREATE INDEX DocumentChunks_document_id_idx ON DocumentChunks(document_id);
CREATE INDEX DocumentChunks_user_id_idx     ON DocumentChunks(user_id);
CREATE INDEX DocumentChunks_embedding_idx
  ON DocumentChunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX DocumentChunks_content_tsv_idx ON DocumentChunks USING gin (content_tsv);

-- ============================================================
-- Chat Sessions
-- ============================================================
CREATE TABLE chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,               -- auto-generated from first message
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_sessions_user_id_idx ON chat_sessions(user_id);

-- ============================================================
-- Chat Messages
-- ============================================================
CREATE TABLE chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content           TEXT NOT NULL,
  citations         JSONB,
  langfuse_trace_id TEXT,
  token_count       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session_id_idx ON chat_messages(session_id);
```

---

## Migration Naming Convention

```
YYYYMMDDHHMMSS_short_description.ts

Examples:
20250101120000_create_users.ts
20250101120100_create_documents.ts
20250102090000_create_DocumentChunks_pgvector.ts
20250103100000_create_chat_tables.ts
```

---

## pgvector Notes

- Use `ivfflat` index for approximate nearest neighbour (ANN) at scale
- `lists = 100` is appropriate for up to ~1M vectors; increase with scale
- At query time: `SET ivfflat.probes = 10` for better recall (default 1)
- Similarity query pattern:
  ```sql
  SELECT id, content, document_id, page_number,
         1 - (embedding <=> $1) AS similarity
  FROM DocumentChunks
  WHERE user_id = $2
    AND 1 - (embedding <=> $1) >= 0.75
  ORDER BY embedding <=> $1
  LIMIT 5;
  ```

---

## Soft Deletes

Only `users` has `deleted_at`. All other tables cascade on delete. User deletion purge job hard-deletes rows with `deleted_at < now() - interval '30 days'`.

---
