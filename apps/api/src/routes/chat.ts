import { Router } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { z } from 'zod';
import { db } from '../../../../packages/db/src/knex';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';
import { streamRagResponse } from '../../../../packages/ai/src/index';

const router = Router();

const SendMessageSchema = z.object({
  content: z.string().min(1).max(10_000),
});

const FeedbackSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

async function getUserByClerkId(clerkUserId: string) {
  const user = await db('Users').where({ clerk_user_id: clerkUserId }).first();
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function getOwnedSession(sessionId: string, userId: string) {
  const session = await db('ChatSessions').where({ id: sessionId, user_id: userId }).first();
  if (!session) throw new AppError(404, 'Session not found');
  return session;
}

// POST /api/v1/chat/sessions
router.post(
  '/sessions',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);

    const now = new Date();
    const [session] = await db('ChatSessions')
      .insert({ user_id: user.id, created_at: now, updated_at: now })
      .returning(['id', 'title', 'created_at', 'updated_at']);

    res.status(201).json({ session });
  }),
);

// GET /api/v1/chat/sessions
router.get(
  '/sessions',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);

    const sessions = await db('ChatSessions')
      .where({ user_id: user.id })
      .select(['id', 'title', 'created_at', 'updated_at'])
      .orderBy('updated_at', 'desc')
      .limit(50);

    res.json({ sessions });
  }),
);

// GET /api/v1/chat/sessions/:id
router.get(
  '/sessions/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const session = await getOwnedSession(req.params['id'] as string, user.id);

    const messages = await db('ChatMessages')
      .where({ session_id: session.id })
      .select(['id', 'role', 'content', 'citations', 'created_at'])
      .orderBy('created_at', 'asc');

    res.json({ session, messages });
  }),
);

// DELETE /api/v1/chat/sessions/:id
router.delete(
  '/sessions/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const session = await getOwnedSession(req.params['id'] as string, user.id);
    await db('ChatSessions').where({ id: session.id }).delete();
    res.status(204).send();
  }),
);

// POST /api/v1/chat/sessions/:id/messages  (SSE streaming)
router.post(
  '/sessions/:id/messages',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const session = await getOwnedSession(req.params['id'] as string, user.id);

    const { content } = SendMessageSchema.parse(req.body);

    // Set session title from first message if still default
    if (session.title === 'New conversation') {
      const title = content.slice(0, 60).trim();
      await db('ChatSessions').where({ id: session.id }).update({ title, updated_at: new Date() });
    } else {
      await db('ChatSessions').where({ id: session.id }).update({ updated_at: new Date() });
    }

    // Persist user message
    const now = new Date();
    const [userMessage] = await db('ChatMessages')
      .insert({
        session_id: session.id,
        user_id: user.id,
        role: 'user',
        content,
        citations: JSON.stringify([]),
        created_at: now,
      })
      .returning(['id', 'role', 'content', 'citations', 'created_at']);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    function sendEvent(type: string, data: unknown) {
      res.write(`data: ${JSON.stringify({ type, ...(typeof data === 'object' ? data : { value: data }) })}\n\n`);
    }

    // Send user message first so the client can add it immediately
    sendEvent('user_message', { message: userMessage });

    await streamRagResponse(db, user.id, content, {
      onToken(token) {
        sendEvent('token', { token });
      },
      async onDone(fullText, citations, traceId) {
        // Persist assistant message
        const [assistantMessage] = await db('ChatMessages')
          .insert({
            session_id: session.id,
            user_id: user.id,
            role: 'assistant',
            content: fullText,
            citations: JSON.stringify(citations),
            langfuse_trace_id: traceId ?? null,
            created_at: new Date(),
          })
          .returning(['id', 'role', 'content', 'citations', 'created_at']);

        sendEvent('done', { message: assistantMessage });
        res.end();
      },
      onError() {
        sendEvent('error', { error: 'Failed to generate response' });
        res.end();
      },
    });
  }),
);

// POST /api/v1/chat/messages/:id/feedback
router.post(
  '/messages/:id/feedback',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const messageId = req.params['id'] as string;

    const { value } = FeedbackSchema.parse(req.body);

    // Verify the message belongs to this user
    const message = await db('ChatMessages')
      .where({ id: messageId, user_id: user.id, role: 'assistant' })
      .first();
    if (!message) throw new AppError(404, 'Message not found');

    await db('ChatMessages').where({ id: messageId }).update({ feedback: value });

    // Forward score to LangFuse if configured and trace ID is available
    if (
      message.langfuse_trace_id &&
      process.env['LANGFUSE_PUBLIC_KEY'] &&
      process.env['LANGFUSE_SECRET_KEY'] &&
      process.env['LANGFUSE_HOST']
    ) {
      try {
        const { Langfuse } = await import('langfuse');
        const lf = new Langfuse({
          publicKey: process.env['LANGFUSE_PUBLIC_KEY'],
          secretKey: process.env['LANGFUSE_SECRET_KEY'],
          baseUrl: process.env['LANGFUSE_HOST'],
        });
        lf.score({
          traceId: message.langfuse_trace_id as string,
          name: 'user-feedback',
          value,
          comment: value === 1 ? 'thumbs_up' : 'thumbs_down',
        });
      } catch {
        // LangFuse is optional — don't fail the request
      }
    }

    res.json({ ok: true });
  }),
);

export default router;
