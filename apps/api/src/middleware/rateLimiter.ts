import rateLimit from 'express-rate-limit';
import { getAuth } from '@clerk/express';
import type { Request } from 'express';

function keyByUser(req: Request): string {
  // After clerkMiddleware() runs, getAuth() returns the decoded JWT context.
  // Fall back to IP for unauthenticated requests hitting a shared limiter.
  return getAuth(req).userId ?? req.ip ?? 'anonymous';
}

const rateLimitResponse = (message: string) => ({
  error: message,
  code: 'RATE_LIMITED',
});

/**
 * Unauthenticated endpoints (health checks).
 * Keyed by IP — no Clerk context available here.
 * 30 req/min is generous enough for legitimate monitoring tools.
 */
export const healthLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitResponse('Too many requests — please slow down.'),
});

/**
 * All authenticated API routes (/api/v1/*).
 * Keyed by Clerk userId so limits are per-user, not per-IP.
 * Covers document CRUD, session management, and any future routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitResponse('Too many requests — please slow down.'),
});

/**
 * Chat message endpoint only.
 * Each request triggers an OpenAI embedding call + pgvector search + LLM stream.
 * Keeping this tight (10/min).
 */
export const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitResponse('Chat rate limit reached — wait a moment before sending another message.'),
});
