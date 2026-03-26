# HomeAtlas

An AI-powered knowledge hub for your home. Upload PDFs (appliance manuals, architectural plans, insurance policies) and query them conversationally.

## Stack

- **API**: Node.js 20 + Express + TypeScript → Railway
- **Frontend**: React 19 + Vite + Material UI → Vercel
- **Database**: Neon (PostgreSQL 16 + pgvector)
- **Storage**: Cloudflare R2
- **Auth**: Clerk
- **AI**: LangChain.js + Claude / OpenAI / Gemini + OpenAI embeddings
- **Queue**: BullMQ + Redis
- **Observability**: LangFuse

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)
- Accounts with API keys for: **Clerk**, **OpenAI** (embeddings), **Cloudflare R2**, and at least one LLM provider (**Anthropic**, **OpenAI**, or **Google**)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your keys:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env
```

**`.env`** (root — used by migration scripts):
```
DATABASE_URL=postgresql://dev:dev@localhost:5432/homeatlas_dev
```

**`apps/api/.env`** — minimum required values:
```
DATABASE_URL=postgresql://dev:dev@localhost:5432/homeatlas_dev
REDIS_URL=redis://localhost:6379

LLM_PROVIDER=anthropic          # or openai | google
LLM_MODEL=claude-sonnet-4-5     # model ID for the chosen provider

ANTHROPIC_API_KEY=sk-ant-...    # if using anthropic
OPENAI_API_KEY=sk-proj-...      # required for embeddings; also for LLM if using openai
GOOGLE_API_KEY=...              # if using google

CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://<account-id>.r2.cloudflarestorage.com

LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

**`apps/worker/.env`** — minimum required values:
```
DATABASE_URL=postgresql://dev:dev@localhost:5432/homeatlas_dev
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-proj-...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
NODE_ENV=development
```

**`apps/web/.env`**:
```
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Start Postgres and Redis

```bash
docker compose up -d
```

This starts `pgvector/pgvector:pg16` on port `5432` and `redis:7-alpine` on port `6379`.

### 4. Run database migrations

```bash
cd packages/db && npm run migrate
```

### 5. Start the services

Open three terminals:

```bash
# Terminal 1 — API (http://localhost:3000)
npm run dev:api

# Terminal 2 — ingestion worker
npm run dev:worker

# Terminal 3 — frontend (http://localhost:5173)
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Sign up, upload a PDF, and start chatting.
