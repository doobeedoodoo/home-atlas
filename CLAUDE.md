# HomeAtlas — AI Document Assistant

> RAG-powered home document repository. Node.js · React · PostgreSQL · pgvector · LangChain · Railway · Neon · Clerk

---

## Project Purpose

HomeAtlas lets homeowners upload PDFs (appliance manuals, architectural plans, land titles, receipts) and query them conversationally. The AI agent retrieves relevant document chunks and answers with cited references.

---

## Repository Layout

```
home-atlas/
├── apps/
│   ├── api/           # Express + Node.js backend
│   └── web/           # React + TypeScript frontend
├── packages/
│   ├── db/            # Knex migrations, seeds, query helpers
│   ├── ai/            # LangChain agent, embeddings, RAG pipeline
│   └── shared/        # Shared types, validation schemas (Zod)
├── docs/              # Architecture diagrams, ADRs
└── features/          # Feature specs (this directory)
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Backend API** | Node.js 20 + Express + TypeScript | REST + SSE for streaming |
| **Frontend** | React 19 + TypeScript + Vite | Material UI v7, React Query |
| **Database** | Neon (serverless PostgreSQL 16 + pgvector) | Free tier; scales to zero |
| **Migrations** | Knex.js | All schema changes versioned |
| **AI / RAG** | LangChain.js + configurable LLM | Provider set via `LLM_PROVIDER` env var: `anthropic` (default), `openai`, `google`; model set via `LLM_MODEL` |
| **Embeddings** | `text-embedding-3-small` (OpenAI) | 1536-dim, stored in pgvector |
| **Observability** | LangFuse | LLM tracing, prompt versioning, cost tracking |
| **Auth** | Clerk | JWTs, email verification, hosted UI components |
| **File Storage** | Cloudflare R2 | S3-compatible API; free up to 10 GB, no egress fees |
| **Job Queue** | BullMQ + Railway Redis | Async ingestion jobs with retries |
| **PDF Processing** | `pdf-parse` + LangChain text splitters | Chunked ingestion |
| **API Hosting** | Railway | Auto-deploy from GitHub; free tier available |
| **Frontend Hosting** | Vercel | Auto-deploy from GitHub; free for personal projects |
| **CI/CD** | GitHub Actions | Lint → test → build → deploy |
| **Logging** | Pino → Railway log drain | Structured JSON logs |

---

## Core Concepts

### Document Pipeline
```
Upload PDF → Cloudflare R2 → BullMQ job → Ingestion Worker
  → pdf-parse (extract text)
  → RecursiveCharacterTextSplitter (512 tokens / 50 overlap)
  → OpenAI embeddings
  → pgvector INSERT (document_chunks table)
```

### RAG Query Flow
```
User message → embed query (OpenAI)
  → vector similarity search (pgvector cosine, Neon)
  → top-k chunk retrieval (k=5, threshold=0.75)
  → LangChain prompt assembly
  → Claude streaming response (SSE)
  → LangFuse trace logged
  → citations surfaced in UI
```

---

## Environment Variables

Secrets are set as environment variables in Railway (API) and Vercel (web). Local development uses `.env.local` (never committed). See `.env.example` for all required keys.

Required for API:
```
DATABASE_URL                # Neon connection string (pooled)
ANTHROPIC_API_KEY
OPENAI_API_KEY              # for embeddings
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL               # public bucket URL for presigned requests
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY
LANGFUSE_HOST
```

Required for web (`VITE_` prefix exposes to browser):
```
VITE_API_URL
VITE_CLERK_PUBLISHABLE_KEY
```

---

## Code Conventions

- **TypeScript strict mode** everywhere
- **Zod** for all runtime validation (API inputs, env vars, AI outputs)
- **Knex** for all DB queries — no raw SQL strings in application code
- **No `any` types** — use `unknown` and assert/narrow
- **Error handling** — all async route handlers wrapped in `asyncHandler`, errors use typed `AppError` class
- **Logging** — structured JSON via `pino`; never `console.log` in production paths
- **Secrets** — never hardcode, never log, validate at startup via Zod env schema
- All AI calls go through `packages/ai` — no direct Anthropic/OpenAI SDK calls from route handlers
- All R2 operations go through a single `packages/storage` wrapper — no direct S3 client calls in routes

---

## Database Schema Overview

See `features/database.md` for full schema. Core tables:

- `users` — Clerk-linked profiles
- `documents` — PDF metadata, R2 key, processing status
- `document_chunks` — vector embeddings (pgvector), parent document ref
- `chat_sessions` — per-user conversation threads
- `chat_messages` — full message history with LangFuse trace IDs

---

## Testing Requirements

- Unit tests: Jest, coverage ≥ 80% on `packages/ai` and `packages/db`
- Integration tests: Supertest against local Docker Compose Postgres
- E2E: Playwright (auth flow, upload flow, chat flow)
- AI evals: LangFuse dataset evaluations for RAG quality

---

## Security Requirements

- All API routes authenticated via Clerk JWT middleware (`@clerk/clerk-sdk-node`)
- Row-level isolation — all queries filter by `user_id = req.auth.userId`
- PDF upload: MIME type validation, 50 MB size limit enforced at API and R2 presigned URL condition
- Rate limiting: `express-rate-limit` — 60 req/min per user, 10 chat req/min
- CORS: explicit origin allowlist (`VITE_API_URL`)
- Helmet.js for HTTP security headers
- No PII in logs or LangFuse traces

---

## Deployment

- **API**: Railway — auto-deploys on push to `main`. Migrations run as a Railway start command (`knex migrate:latest`) before the server starts.
- **Frontend**: Vercel — auto-deploys on push to `main`. No build config required for Vite.
- **Rollback**: Railway supports one-click rollback to any previous deployment.

---

## Local Development

```bash
# Start local Postgres + Redis
docker compose up

# Run migrations against local DB
cd packages/db && npm run migrate

# Start API with hot reload
cd apps/api && npm run dev

# Start frontend
cd apps/web && npm run dev
```

Docker Compose runs `pgvector/pgvector:pg16` and `redis:7-alpine` only. No LocalStack needed — R2 uses the real Cloudflare account (free tier), and Clerk uses development-mode keys.

---

## Frontend — `apps/web`

### Stack & Versions

| Package | Version | Notes |
|---|---|---|
| React | 19 | Concurrent features; use `use` hook for async |
| TypeScript | ~5.9 | Strict mode; `tsconfig.app.json` is the source of truth |
| Vite | 8 | Dev server + bundler |
| Material UI | 7 (`@mui/material`) | Component library |
| Emotion | 11 (`@emotion/react`, `@emotion/styled`) | MUI's CSS-in-JS engine |
| React Router | 7 | Client-side routing |
| TanStack Query | 5 (`@tanstack/react-query`) | Server state, caching, mutations |
| Clerk React | latest | Auth UI via `@clerk/clerk-react` |

---

### File Structure

```
apps/web/src/
├── main.tsx                  # App entry — providers only
├── App.tsx                   # Router + top-level layout
├── theme.ts                  # MUI theme (palette, typography, components)
├── mocks/                    # Mock data for Slice 0.5; deleted when real API is wired
│   ├── documents.ts
│   └── chat.ts
├── api/                      # API client functions (one file per resource)
│   ├── client.ts             # Axios/fetch base with auth header injection
│   ├── documents.ts
│   └── chat.ts
├── hooks/                    # Custom hooks (wrap TanStack Query calls)
│   ├── useDocuments.ts
│   └── useChat.ts
├── components/               # Shared, stateless UI components
│   ├── AppShell/
│   │   ├── AppShell.tsx
│   │   └── Sidebar.tsx
│   └── CitationChip/
│       └── CitationChip.tsx
├── pages/                    # One directory per route
│   ├── Documents/
│   │   ├── DocumentsPage.tsx
│   │   ├── DocumentList.tsx
│   │   └── UploadZone.tsx
│   ├── Chat/
│   │   ├── ChatPage.tsx
│   │   ├── MessageList.tsx
│   │   └── SessionSidebar.tsx
│   └── Auth/
│       ├── SignInPage.tsx
│       └── SignUpPage.tsx
└── types/                    # Frontend-only types (not shared with API)
    └── index.ts
```

---

### Component Conventions

- **One component per file.** File name matches the exported component name.
- **Functional components only** — no class components.
- **Props typed inline** with a `Props` interface at the top of the file; never use `React.FC<Props>`.
- **No default exports from `pages/` barrel files** — import directly from the component file.
- Keep components small: if a component exceeds ~120 lines, extract a child component.
- Co-locate styles with the component using `sx` prop or `styled()`; no global CSS except resets in `main.tsx`.

```tsx
// Correct
interface Props {
  document: Document;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document, onDelete }: Props) { ... }
```

---

### MUI Usage Rules

- **Theme first** — all colours, spacing, and typography come from `theme.ts`. Never hardcode hex values or `px` sizes outside the theme.
- **`sx` prop for one-off styles** — prefer `sx` over inline `style` or `styled()` for single-use overrides.
- **`styled()` for reusable styled components** — when the same style block is used in two or more places, extract it.
- **Use MUI primitives** — `Box`, `Stack`, `Typography`, `Divider` before reaching for custom HTML elements.
- **`Stack` for layout** — prefer `Stack` with `spacing` and `direction` over manual `flexbox` in `sx`.
- **No Tailwind** — MUI's `sx` system and theme handle all styling; do not mix in Tailwind classes.
- **Icons** — import from `@mui/icons-material` only; do not add other icon libraries.
- **Theme palette** — primary is teal green (`#008080` base), background and surface use black/grey/white scale.

```tsx
// Correct
<Stack direction="row" spacing={2} alignItems="center">
  <Typography variant="body2" color="text.secondary">{label}</Typography>
</Stack>

// Wrong — hardcoded colour
<Box sx={{ color: '#666' }}>...</Box>
```

---

### State Management

- **Server state** — TanStack Query (`useQuery`, `useMutation`). All API calls go through query hooks in `hooks/`.
- **Local UI state** — `useState` / `useReducer` within the component. Do not lift UI-only state to a global store.
- **Auth state** — provided by Clerk's `useUser` / `useAuth` hooks; never duplicated in local state.
- **Form state** — uncontrolled inputs with `useRef`, or a single `useState` per field. No form library until complexity demands it.

---

### API Layer

- All fetch calls live in `api/` — pages and hooks never call `fetch` directly.
- During Slice 0.5, `api/` functions return mock data imported from `mocks/`. The function signature stays identical so wiring the real API is a one-line change.
- TanStack Query hooks in `hooks/` wrap the `api/` functions; pages import hooks, not `api/` functions.
- Auth tokens are attached in `api/client.ts` — nowhere else.

---

### AI Assistant Instructions — Frontend

12. **MUI over custom CSS** — use MUI components and the `sx` prop; never introduce Tailwind or CSS modules
13. **TanStack Query for all server state** — no `useEffect` + `fetch` patterns
14. **Mock data lives in `mocks/`** — keep the same function signatures so swapping to real API requires no component changes
15. **Strict component size** — flag and extract if a component exceeds ~120 lines
16. **No inline theme values** — always reference `theme.palette`, `theme.spacing`, or `theme.typography` tokens

---

## AI Assistant Instructions

When helping with this codebase:

1. **Always use TypeScript** — no `.js` files in `apps/` or `packages/`
2. **Respect the layered architecture** — AI logic in `packages/ai`, storage in `packages/storage`, not in route handlers
3. **Use Knex query builder** — never raw SQL strings
4. **Validate with Zod** — all external inputs (API body, query params, AI JSON outputs)
5. **LangFuse tracing** — every LLM call must be wrapped in a LangFuse trace
6. **pgvector cosine** — use `<=>` operator for similarity, not `<->` (L2 distance)
7. **Streaming responses** — chat endpoint uses `text/event-stream`, not JSON batch
8. **Never expose internal errors** — use `AppError` with safe user-facing messages
9. **Citations are required** — RAG responses must include `chunkId` references in structured output
10. **R2 is S3-compatible** — use `@aws-sdk/client-s3` with the R2 endpoint; do not use AWS-specific features like SSE-KMS
11. When generating migrations, follow the existing Knex migration naming convention: `YYYYMMDDHHMMSS_description.ts`
