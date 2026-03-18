# Feature: RAG Chat Agent

## Overview

The core AI feature. Users ask questions in natural language; the agent retrieves relevant chunks from their documents using vector similarity search, constructs a grounded prompt, and streams a cited response using Claude.

---

## User Stories

- As a user, I can ask a question about any of my uploaded documents in a chat interface.
- As a user, I receive a streamed answer so I don't wait for the full response.
- As a user, every answer includes citations showing which document and page the information came from.
- As a user, I can click a citation to view the source chunk in context.
- As a user, I can start a new conversation or continue a previous one.
- As a user, I can see my conversation history.
- As a user, when no relevant documents are found, I am told clearly rather than receiving a hallucinated answer.

---

## Data Model

```sql
chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,               -- auto-generated from first message
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

chat_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  citations        JSONB,           -- array of { chunkId, documentId, documentName, pageNumber, excerpt }
  langfuse_trace_id TEXT,           -- for observability linkback
  token_count      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_sessions_user_id_idx  ON chat_sessions(user_id);
CREATE INDEX chat_messages_session_id_idx ON chat_messages(session_id);
```

---

## Agent Architecture

### RAG Pipeline (`packages/ai/src/rag-pipeline.ts`)

```
User query
  │
  ▼
1. Embed query (OpenAI text-embedding-3-small)
  │
  ▼
2. Vector similarity search (pgvector cosine)
     WHERE user_id = ?
     ORDER BY embedding <=> $queryEmbedding
     LIMIT 5
     HAVING cosine_similarity >= 0.75
  │
  ▼
3. If no chunks above threshold:
     → Return "no relevant documents found" response
  │
  ▼
4. Build grounded prompt
     System: HomeAtlas agent instructions + citation format requirements
     Context: top-k chunks formatted with document name + page number
     History: last N messages from session (N=10)
     User: current query
  │
  ▼
5. Stream completion via Claude (claude-3-5-sonnet)
     → SSE stream to client
  │
  ▼
6. Parse citations from structured output
7. Persist assistant message + citations to DB
8. Log LangFuse trace (query, chunks, response, token counts, latency)
```

### System Prompt

```
You are HomeAtlas, an AI assistant that answers questions about a user's home documents.

You have access to the following document excerpts retrieved for this query.
Answer ONLY based on these excerpts. If the answer is not contained in the excerpts,
say "I don't have enough information in your documents to answer that."

For every factual claim, include a citation in this format: [Source: <documentName>, p.<pageNumber>]

Be concise and direct. Format structured steps as numbered lists.
```

### Citation Format

The LLM is instructed to emit citations inline. The API parses them from the streamed text and returns a structured `citations` array alongside the message content.

```typescript
interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  excerpt: string;   // first 200 chars of the chunk
}
```

---

## API Endpoints

### Sessions


| Method | Path                      | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | /api/v1/chat/sessions     | List sessions for user (paginated) |
| POST   | /api/v1/chat/sessions     | Create new session                 |
| GET    | /api/v1/chat/sessions/:id | Get session with messages          |
| DELETE | /api/v1/chat/sessions/:id | Delete session + messages          |


### Messages


| Method | Path                               | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| POST   | /api/v1/chat/sessions/:id/messages | Send message, stream response |


### Streaming Response (`POST /chat/sessions/:id/messages`)

Request:

```json
{ "content": "My television is not turning on. What should I do?" }
```

Response: `Content-Type: text/event-stream`

```
data: {"type":"chunk","text":"Based on your Samsung TV manual, "}
data: {"type":"chunk","text":"check the following steps:\n\n1. "}
data: {"type":"chunk","text":"Ensure the power cable is firmly connected..."}
data: {"type":"done","citations":[{"documentId":"...","documentName":"Samsung TV Manual","pageNumber":12,"excerpt":"If the TV does not turn on..."}]}
```

---

## Observability (LangFuse)

Every RAG call logs:

- Input: user query, retrieved chunk IDs, similarity scores
- Output: response text, citation list, stop reason
- Metadata: session ID, user ID (hashed)
- Metrics: latency, prompt tokens, completion tokens, estimated cost

LangFuse is used for:

- Debugging poor retrievals (inspect which chunks were selected)
- Prompt versioning (track performance across prompt changes)
- Cost monitoring per user / per session
- Dataset creation for offline RAG eval

---

## Rate Limiting

- Chat endpoint: 10 requests/min per user
- Max message length: 1000 characters
- Max session history included in prompt: 10 messages (5 turns)

---

## Phase

MVP (basic RAG, streaming, inline citations, session history)
Phase 2 (multi-document comparison queries, agent tools)