# Vertical Thin Slices

Implementation order for HomeAtlas. Each slice is independently deployable and demonstrable. Work top-to-bottom — dependencies are strict.

---

## Slice 0 — Deployable Skeleton

_No features, just a working deploy pipeline end-to-end._

- Initialise `apps/api`: Express + TypeScript + pino + health endpoints (`/health/live`, `/health/ready`)
- Initialise `apps/web`: Vite + React + Tailwind + placeholder homepage
- Set up Knex in `packages/db` with connection to local Docker Postgres
- Write first migration: `users` table only
- Deploy API to Railway (verify health check passes)
- Deploy frontend to Vercel (verify build succeeds)
- Connect Neon as the production database, run migration
- Set up GitHub Actions CI (lint + typecheck + test on push)

**Done when:** `GET /health/ready` returns 200 in production and the frontend in Vercel loads.

---

## Slice 0.5 — UI Shell (Mocked)

_The full application UI is built and navigable with mocked data — no real API calls._

- Set up React Router in `apps/web`; define routes for `/`, `/documents`, `/chat`, `/login`
- Build the persistent app shell:
  - The side bar should contain the menu. The menu should contain icons that navigate to Documents and Chat. At the bottom of the menu, an avatar is displayed, when if clicked, opens up a submenu that displays the user info and an option to logout.
- Build the **Documents** page:
  - Mocked document list (name, status badge, upload date)
  - Upload button/drag-and-drop zone (no-op on submit)
  - Rename and delete actions (UI only)
- Build the **Chat** page:
  - Message list with mock assistant and user messages
  - Text input + send button (appends a mock response locally)
  - Citation chips below mock assistant messages
  - Session sidebar with a few hardcoded past sessions
- Build placeholder **Sign In / Sign Up** pages (no Clerk yet)
- All API calls replaced by in-module mock data or a `mocks/` helper file
- The website is inspired by how https://claude.ai/new looks.
- Use a theme that is soothing to the eyes: with black, gray and white as the major colors and teal green as the accent.
- Responsive layout from the start: sidebar collapses on mobile

**Done when:** A developer can navigate every screen, see realistic placeholder content, and demo the full UI flow without a running backend.

---

## Slice 1 — Authentication

_Users can sign up, verify email, sign in, and sign out._

- Configure Clerk dashboard (email + password, dev + prod key pairs)
- Install `@clerk/clerk-react` in `apps/web`, wrap app in `ClerkProvider`
- Build Sign Up, Sign In, and Verify Email pages using Clerk components
- Add `requireAuth` middleware to `apps/api` using `@clerk/clerk-sdk-node`
- Implement `POST /api/v1/users/sync` — create local `users` record from Clerk JWT
- Implement `GET /api/v1/users/me` — return current user profile
- Add auth token attachment to the API fetch wrapper in `apps/web`
- Protect all frontend routes; redirect unauthenticated users to `/login`

**Done when:** A new user can complete the full sign-up → verify → sign-in → sign-out loop in production.

---

## Slice 2 — Document Upload

_Users can upload a PDF, give it a name, and see it in their library._

- Write migration: `documents` table
- Create `packages/storage`: R2 client wrapper, `generateUploadUrl`, `generateDownloadUrl`, `deleteObject`
- Configure Cloudflare R2 bucket (private, CORS for presigned PUT)
- Implement `POST /api/v1/documents/upload-url` — validate name + file, create DB record, return presigned URL
- Implement `POST /api/v1/documents/:id/confirm` — mark status `processing`
- Implement `GET /api/v1/documents` — flat list for current user, `?q=` name search
- Implement `GET /api/v1/documents/:id`, `PATCH /api/v1/documents/:id` (rename), `DELETE /api/v1/documents/:id`
- Implement `GET /api/v1/documents/:id/download-url` — presigned download URL
- Build documents dashboard: flat list with name, status badge, upload date
- Build upload flow: drag-and-drop zone + name input field; client-side validation before upload
- Wire status polling: `GET /api/v1/documents/:id` every 3s while `status === 'processing'`

**Done when:** A signed-in user can upload a PDF named "Samsung TV Manual", see it appear in their library with a `pending` badge, and download it back. Status remains `pending` until the ingestion pipeline (Slice 3) is wired up.

---

## Slice 3 — Document Ingestion Pipeline

_Uploaded PDFs are processed into searchable vector chunks._

- Set up Upstash Redis; configure BullMQ `ingestion` queue in `packages/db`
- Build `apps/worker`: BullMQ consumer process, connects to same Neon + Redis
- Write migration: `DocumentChunks` table with pgvector column (no index — sequential scan is sufficient at current scale)
- Wire `POST /api/v1/documents/:id/confirm` to enqueue a BullMQ job
- Implement ingestion job handler:
  - Download PDF from R2
  - Extract text with `pdf-parse`
  - Split with `RecursiveCharacterTextSplitter` (512 tokens, 50 overlap)
  - Batch embed chunks with OpenAI `text-embedding-3-small`
  - Bulk insert into `DocumentChunks`
  - Update document status → `ready` (or `failed` with error message)
- Deploy worker as second Railway service
- Frontend: status badge now transitions `pending → processing → ready`

**Done when:** Uploading a real appliance manual PDF results in `status: ready` and queryable chunks in the database.

---

## Slice 4 — RAG Chat (Core)

_Users can ask questions and get cited answers from their documents._

- Create `packages/ai`: LangChain RAG pipeline, prompt templates, citation parser
- Write migration: `chat_sessions` and `chat_messages` tables
- Integrate LangFuse — wrap every LLM call in a trace
- Implement `POST /api/v1/chat/sessions` — create session
- Implement `GET /api/v1/chat/sessions/:id` — get session with messages
- Implement `POST /api/v1/chat/sessions/:id/messages` — the core RAG endpoint:
  - Embed user query
  - pgvector similarity search across **all of the user's document chunks** (no scoping by item or space — the entire library is always in scope)
  - Assemble grounded prompt with top-k context
  - Stream Claude response via SSE
  - Parse citations from response
  - Persist assistant message + citations
- Build chat UI in `apps/web`:
  - Text input + send button
  - Message list with streaming token-by-token display
  - Citation chips below each assistant message (document name + page)
  - "No relevant documents found" empty state

**Done when:** A user can type "How do I descale my coffee maker?" and receive a streamed, cited answer drawn from their uploaded manual.

---

## Slice 5 — Chat Session Management

_Users can start new conversations and revisit old ones._

- Implement `GET /api/v1/chat/sessions` — paginated session list
- Implement `DELETE /api/v1/chat/sessions/:id`
- Auto-generate session title from first user message (single LLM call, no streaming)
- Build session sidebar in `apps/web`: list of past sessions, new chat button
- Navigate between sessions without losing scroll position
- Wire citation chips to open the source PDF via presigned download URL

**Done when:** A user can see their full chat history, switch between sessions, and click a citation to download the source PDF.

---

## Slice 6 — Observability & Hardening

_The app is resilient and debuggable._

- Add Sentry to `apps/api` and `apps/web` — uncaught exceptions with user context
- Add `express-rate-limit`: 60 req/min general, 10 req/min on chat endpoint
- Add LangFuse prompt versioning — move system prompt out of code into LangFuse dashboard
- Add BullMQ Board as a protected Express route (`/admin/queues`)
- Add document re-processing: `POST /api/v1/documents/:id/reprocess` — re-enqueues failed jobs
- Harden health check: `/health/ready` verifies Neon, R2, and Redis connectivity
- Add `pino-http` request logging middleware — every request logged with duration + status

**Done when:** A failed ingestion can be retried from the UI, errors are visible in Sentry, and every chat trace is inspectable in LangFuse.

---

## Slice 7 — UI Polish & Responsiveness

_The app is demo-ready and works on mobile._

- Responsive layout: sidebar collapses to bottom nav on mobile
- Loading skeletons on all data-fetching states
- Error boundaries with user-friendly fallback UI
- Empty states with onboarding prompts (no documents, no chat history)
- Animate chat message appearance (fade-in per token)
- Favicon, page titles, and Open Graph meta tags

**Done when:** The app looks polished enough to record a demo video and share the URL in a portfolio or job application.

---

## Slice 8 — Advanced AI (Phase 2)

_Differentiating AI features that go beyond basic RAG._

- **URL ingestion**:
  - SSRF guard utility: block private IP ranges and non-HTTPS schemes before fetching
  - Scraping worker in `packages/ai`: fetch URL → `@mozilla/readability` + `jsdom` → extract article body → `RecursiveCharacterTextSplitter` → embed → insert chunks
  - New endpoint `POST /api/v1/documents/ingest-url` (Zod `IngestUrlSchema`): validate, insert `documents` row with `status: 'pending'`, enqueue BullMQ job
  - Update `GET /api/v1/documents/:id/download-url`: redirect to `source_url` for URL-sourced docs instead of generating a presigned URL
  - UI: "Add from URL" tab in upload zone; document detail shows source URL as a link
- **Hybrid search**: combine pgvector cosine with PostgreSQL `ts_vector` full-text search (RRF re-ranking)
- **Query reformulation**: LLM rewrites ambiguous queries before retrieval
- **Structured extraction on ingestion**: extract document type, key dates, and metadata from the PDF automatically on upload
- **Conversational memory**: summarise sessions exceeding 10 turns, inject summary as context
- **Multi-document comparison**: "Compare the warranty terms across my appliance manuals"
- **LangFuse evals**: automated RAG quality scoring pipeline with curated test dataset
- **User feedback**: thumbs up/down on responses, scores written back to LangFuse traces

**Done when:** You can demo each capability individually and reference them in a technical interview as deliberate design decisions.

---
