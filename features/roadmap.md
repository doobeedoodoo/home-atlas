# Product Roadmap

## Summary

| Phase | Theme
|---|---
| MVP | Core loop: upload PDF → ask questions → get cited answers
| Phase 1 | Production hardening + UX polish
| Phase 2 | Advanced AI capabilities
| Phase 3 | Collaboration + platform features

---

## MVP

**Goal**: A working, deployed app that demonstrates the core RAG loop end-to-end.

### Included

- [ ] Auth: Clerk sign up, sign in, email verification, sign out
- [ ] Documents: upload PDF with a user-defined name, flat list dashboard
- [ ] Document processing: Cloudflare R2 storage → pdf-parse → chunking → pgvector embeddings (Neon)
- [ ] Ingestion queue: BullMQ + Upstash Redis with retry on failure
- [ ] RAG Chat: text input, streamed response, inline citations with document name + page
- [ ] Chat sessions: create new session, view history, basic session list
- [ ] Basic observability: pino structured logs → Railway, LangFuse traces
- [ ] Deployment: Railway (API + worker), Vercel (frontend), Neon (DB), Cloudflare R2 (storage)

### Explicitly out of scope for MVP

- Real-time processing status (polling only)
- Virus scanning
- Sentry error tracking
- Mobile-responsive UI (desktop-first)

---

## Phase 1: Production Hardening

**Goal**: Make the MVP genuinely production-ready and polished enough for portfolio showcase.

### Features

- [ ] **Real-time document status**: WebSocket notifications when ingestion completes
- [ ] **Rate limiting**: per-user limits on API + chat endpoints
- [ ] **Sentry integration**: exception tracking with stack traces and user context
- [ ] **LangFuse evals**: full trace visibility, prompt versioning, thumbs-up/down feedback scores
- [ ] **BullMQ Board**: protected dashboard route for monitoring ingestion queue
- [ ] **UI polish**: responsive design, loading states, error boundaries, empty states
- [ ] **Document re-processing**: manual retry on failed documents
- [ ] **Session management**: rename sessions, auto-title from first message
- [ ] **E2E tests**: Playwright covering auth, upload, and chat happy paths

---

## Phase 2: Advanced AI

**Goal**: Differentiate with more sophisticated AI capabilities; strengthen portfolio story.

### Features

- [ ] **URL ingestion**: user provides a URL; the system scrapes the page, chunks the text, and stores embeddings — no file upload needed. Uses `@mozilla/readability` + `jsdom` for content extraction; SSRF guard blocks private IP ranges.
- [ ] **Multi-document comparison**: "Compare the warranty terms of my washing machine and dishwasher"
- [ ] **Agent tools**: give the LLM tools it can call (search by item, filter by date, lookup model)
- [ ] **Structured extraction**: extract model number, serial, warranty from uploaded manual on ingestion
- [ ] **Proactive insights**: weekly digest — "Your fridge warranty expires in 30 days"
- [ ] **Hybrid search**: combine pgvector similarity with PostgreSQL full-text search (BM25 via `ts_vector`)
- [ ] **Query reformulation**: LLM rewrites ambiguous user queries before retrieval
- [ ] **Conversational memory**: summarise long sessions and inject summary as context
- [ ] **Feedback loop**: thumbs up/down on chat responses → LangFuse dataset for eval
- [ ] **LangFuse evals**: automated RAG quality scoring (relevance, faithfulness, citation accuracy)
- [ ] **PDF viewer with highlights**: show the source PDF with cited passage highlighted

---

## Phase 3: Platform

**Goal**: Expand scope to justify long-term value; explore multi-user / sharing scenarios.

### Features

- [ ] **Household sharing**: invite a partner to a shared vault (same items/docs, separate accounts)
- [ ] **Contractor mode**: share specific documents with a plumber/electrician without full access
- [ ] **OCR support**: handle scanned (image-based) PDFs via AWS Textract
- [ ] **Non-PDF formats**: Word docs, images of receipts (via Textract)
- [ ] **Receipt parsing**: structured extraction of purchase date, price, store from receipt images
- [ ] **Mobile app**: React Native with camera upload for receipt photos
- [ ] **Reminder system**: scheduled notifications (warranty expiry, filter replacement dates)
- [ ] **Export**: download a full data export (all documents + chat history) as ZIP

---

## Concept Map

| Concept | Details |
|---|---|
| RAG pipeline design | `packages/ai`, `features/rag-chat.md` |
| Vector databases (pgvector) | `features/database.md`, embedding storage + retrieval |
| LLM observability (LangFuse) | `features/observability.md`, trace + eval setup |
| Agentic AI patterns (Phase 2) | Tool-calling, query reformulation, multi-doc reasoning |
| Streaming AI responses (SSE) | Chat endpoint, token-by-token streaming |
| Async job queues (BullMQ) | Ingestion pipeline, retry logic, job state tracking |
| TypeScript full-stack | End-to-end type safety, Zod validation |
| Structured AI outputs | Citation extraction, structured JSON from LLM |
| AI eval / quality measurement | LangFuse datasets, offline regression testing |
| Cloud-agnostic storage (R2) | S3-compatible API without AWS lock-in |
| Web scraping + SSRF defence | URL ingestion, readability extraction, private-IP blocking |
