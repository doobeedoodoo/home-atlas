# Feature: Documents Management

## Overview

Users upload PDF documents and give each one a name. Documents are owned directly by the user — there is no folder, space, or item hierarchy. This is the core data model the RAG pipeline operates on.

---

## User Stories

- As a user, I can upload a PDF and give it a name (e.g. "Samsung TV Manual", "Electrical Layout", "Land Title").
- As a user, I can see all my documents in a flat list on my dashboard.
- As a user, I can rename or delete any of my documents.
- As a user, I can see the processing status of each document (pending / processing / ready / failed).
- As a user, I can download the original PDF I uploaded.
- As a user, I can filter my document list by name using a search input.

---

## Data Model

```sql
documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  r2_key          TEXT UNIQUE,               -- NULL for URL-sourced docs
  source_url      TEXT,                      -- Phase 2: set for URL-ingested docs
  file_size_bytes BIGINT,                    -- NULL for URL-sourced docs
  mime_type       TEXT NOT NULL DEFAULT 'application/pdf',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','ready','failed')),
  error_message   TEXT,
  page_count      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_user_id_idx ON documents(user_id);
CREATE INDEX documents_status_idx  ON documents(status);

DocumentChunks (
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
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/documents/upload-url | Get presigned R2 upload URL |
| POST | /api/v1/documents/:id/confirm | Confirm upload complete, trigger ingestion |
| POST | /api/v1/documents/ingest-url | **Phase 2** — submit a URL for scraping and ingestion |
| GET | /api/v1/documents | List all documents for user; `?q=` for name search |
| GET | /api/v1/documents/:id | Get document details + status |
| PATCH | /api/v1/documents/:id | Rename document |
| DELETE | /api/v1/documents/:id | Delete document, chunks, and R2 object |
| GET | /api/v1/documents/:id/download-url | Get presigned R2 download URL (valid 15 min); redirects to `source_url` for URL-sourced docs |
| POST | /api/v1/documents/:id/reprocess | Re-enqueue a failed document for ingestion |

All routes: `Authorization: Bearer <token>` required. Row-level enforcement: all queries filter by `user_id = req.auth.userId`.

---

## Validation (Zod)

```typescript
export const UploadUrlSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(50 * 1024 * 1024), // 50 MB
});

export const RenameDocumentSchema = z.object({
  name: z.string().min(1).max(200),
});

// Phase 2 — URL ingestion
export const IngestUrlSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2048).refine(
    (u) => u.startsWith('https://'),
    'Only HTTPS URLs are accepted'
  ),
});
```

---

## UI Considerations

- Dashboard: flat document list, sortable by name / upload date / status
- Status badge: `pending` (gray), `processing` (amber, animated), `ready` (green), `failed` (red + retry button)
- Upload flow: drag-and-drop zone with name input field; file type and size validated client-side before upload starts
- **Phase 2 — URL tab**: toggle between "Upload file" and "Add from URL"; URL tab shows a name field + URL field; submits to `POST /api/v1/documents/ingest-url`; source URL displayed as a link in the document detail view in place of the download button
- Empty state: prompt to upload first document with example suggestions ("Try uploading an appliance manual")
- Search: client-side filter on document name — no API call needed for small lists

---

## Phase

MVP (file upload, CRUD, download)
Phase 2 (URL ingestion — `ingest-url` endpoint, schema migration, scraping worker, URL tab in upload UI)
