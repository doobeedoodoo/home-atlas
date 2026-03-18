# HomeAtlas

AI-powered home document assistant. Upload appliance manuals, architectural plans, and receipts — then ask questions about them in plain language.

## Stack

- **API**: Node.js 20 + Express + TypeScript → Railway
- **Frontend**: React 18 + Vite + Tailwind → Vercel
- **Database**: Neon (PostgreSQL 16 + pgvector)
- **Storage**: Cloudflare R2
- **Auth**: Clerk
- **AI**: LangChain.js + Claude + OpenAI embeddings
- **Queue**: BullMQ + Upstash Redis
- **Observability**: LangFuse

## Local Development

\`\`\`bash
cp .env.example .env.local   # fill in your keys
docker compose up -d         # start Postgres + Redis
npm install
npm run dev:api
npm run dev:web
\`\`\`

See \`CLAUDE.md\` for full architecture, conventions, and AI assistant instructions.
See \`features/\` for feature specs and roadmap.