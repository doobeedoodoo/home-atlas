import { Router } from 'express';
import { requireAuth, getAuth, createClerkClient } from '@clerk/express';
import { db } from '../../../../packages/db/src/knex';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';

const router = Router();

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function upsertUser(userId: string) {
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

  const now = new Date();

  const [user] = await db('Users')
    .insert({
      clerk_user_id: userId,
      email,
      display_name: displayName,
      created_at: now,
      updated_at: now,
    })
    .onConflict('clerk_user_id')
    .merge({ email, display_name: displayName, updated_at: now })
    .returning('*');

  return user;
}

// GET /api/v1/users/me
router.get(
  '/me',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) throw new AppError(401, 'Unauthorized');
    const user = await upsertUser(userId);
    res.json({ user });
  }),
);

// POST /api/v1/users/sync
router.post(
  '/sync',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) throw new AppError(401, 'Unauthorized');
    const user = await upsertUser(userId);
    res.json({ user });
  }),
);

export default router;
