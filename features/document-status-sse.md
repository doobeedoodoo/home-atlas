# Feature: Document Status SSE

## Status

**Planned** — interim solution is a manual refresh button on the Documents page.
Tracked in `docs/architecture.md § Document Status SSE (Planned)`.

---

## Problem

After a user uploads a PDF, the BullMQ worker processes it asynchronously. The client has no way to know when processing finishes without either polling the API or the user manually refreshing. Polling was removed because it generated unnecessary API load (one request every 3 seconds per connected user).

---

## Solution

Use Server-Sent Events (SSE) to push a single event to the client the moment a document's ingestion job completes or fails. The client then performs one targeted refetch — no polling, no wasted requests.

---

## Design

### New API endpoint

```
GET /api/v1/documents/status-stream
```

- Authenticated via Clerk JWT passed as `?token=<jwt>` query param (EventSource does not support custom headers)
- Sets `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Registers the response object in a per-user `SseManager` singleton
- Cleans up on `req.on('close')`

### Events emitted

```
event: document:ready
data: {"documentId":"<uuid>"}

event: document:failed
data: {"documentId":"<uuid>"}
```

### SseManager (new — `packages/sse/src/index.ts`)

A singleton that maps `userId → Set<Response>`. Supports multiple open connections per user (e.g. two browser tabs).

```ts
class SseManager {
  private clients = new Map<string, Set<Response>>();

  subscribe(userId: string, res: Response): void
  unsubscribe(userId: string, res: Response): void
  emit(userId: string, event: string, data: unknown): void
}

export const sseManager = new SseManager();
```

### BullMQ worker integration

In the ingestion worker, after updating document status in the DB:

```ts
worker.on('completed', (job) => {
  sseManager.emit(job.data.userId, 'document:ready', { documentId: job.data.documentId });
});

worker.on('failed', (job) => {
  if (job) sseManager.emit(job.data.userId, 'document:failed', { documentId: job.data.documentId });
});
```

### Frontend — `useDocumentStatusStream` hook

```ts
// apps/web/src/hooks/useDocumentStatusStream.ts
export function useDocumentStatusStream() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource;

    getToken().then((token) => {
      es = new EventSource(`${API_BASE_URL}/api/v1/documents/status-stream?token=${token}`);

      es.addEventListener('document:ready', () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      });

      es.addEventListener('document:failed', () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      });
    });

    return () => es?.close();
  }, [getToken, queryClient]);
}
```

Called once in `DocumentsPage`:

```ts
export function DocumentsPage() {
  useDocumentStatusStream();
  // ...
}
```

The manual refresh button can remain as a fallback once SSE is implemented.

---

## Impact on existing code

| File | Change |
|---|---|
| `packages/sse/src/index.ts` | New package — `SseManager` singleton |
| `apps/api/src/routes/documents.ts` | Add `GET /status-stream` route |
| `apps/api/src/worker/ingestionWorker.ts` | Emit SSE events on job complete/fail |
| `apps/web/src/hooks/useDocumentStatusStream.ts` | New hook |
| `apps/web/src/pages/Documents/DocumentsPage.tsx` | Call `useDocumentStatusStream()` |
| `apps/web/src/hooks/useDocuments.ts` | No change needed — polling already removed |

---

## Auth note

`EventSource` in the browser does not support the `Authorization` header. The JWT is passed as a `?token=` query param. The `status-stream` route reads it from `req.query.token` and verifies it via Clerk's `verifyToken()` helper rather than the standard `requireAuth()` middleware.

---

## Edge cases

- **User has two tabs open** — `SseManager` stores a `Set<Response>` per user; both connections receive the event, both tabs update independently.
- **Worker and API run as separate Railway services** — `SseManager` is an in-process singleton. If the worker is a separate process (as is typical), it cannot share the singleton with the API directly. The worker must communicate via Redis pub/sub: publish the event to a Redis channel; the API subscribes and writes to the open SSE connections. This is the recommended implementation approach.
- **Connection drops** — `EventSource` reconnects automatically with exponential backoff. No special handling needed.
