import { Router } from 'express';
import { requireAuth, getAuth } from '@clerk/express';
import { randomUUID } from 'crypto';
import path from 'path';
import { z } from 'zod';
import { db } from '../../../../packages/db/src/knex';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';
import {
  generateUploadUrl,
  generateDownloadUrl,
  deleteObject,
} from '../../../../packages/storage/src';

const router = Router();

const UploadUrlSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  mimeType: z.enum(['application/pdf']),
});

const RenameSchema = z.object({
  name: z.string().min(1).max(200),
});

const SAFE_COLUMNS = [
  'id', 'name', 'status', 'mime_type', 'file_size_bytes',
  'page_count', 'error_message', 'created_at', 'updated_at',
] as const;

async function getUserByClerkId(clerkUserId: string) {
  const user = await db('Users').where({ clerk_user_id: clerkUserId }).first();
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function getOwnedDoc(docId: string, userId: string) {
  const doc = await db('Documents').where({ id: docId, user_id: userId }).first();
  if (!doc) throw new AppError(404, 'Document not found');
  return doc;
}

// POST /api/v1/documents/upload-url
router.post(
  '/upload-url',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const { name, fileName, fileSizeBytes, mimeType } = UploadUrlSchema.parse(req.body);

    const docId = randomUUID();
    const ext = path.extname(fileName) || '.pdf';
    const r2Key = `docs/${user.id}/${docId}${ext}`;
    const now = new Date();

    await db('Documents').insert({
      id: docId,
      user_id: user.id,
      name,
      r2_key: r2Key,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });

    const uploadUrl = await generateUploadUrl(r2Key, mimeType);
    res.status(201).json({ documentId: docId, uploadUrl });
  }),
);

// POST /api/v1/documents/:id/confirm
router.post(
  '/:id/confirm',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    await getOwnedDoc(id, user.id);

    const [doc] = await db('Documents')
      .where({ id })
      .update({ status: 'processing', updated_at: new Date() })
      .returning(SAFE_COLUMNS);

    res.json({ document: doc });
  }),
);

// GET /api/v1/documents
router.get(
  '/',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);

    let query = db('Documents')
      .where({ user_id: user.id })
      .select(SAFE_COLUMNS)
      .orderBy('created_at', 'desc');

    if (typeof req.query['q'] === 'string' && req.query['q']) {
      query = query.whereILike('name', `%${req.query['q']}%`);
    }

    const documents = await query;
    res.json({ documents });
  }),
);

// GET /api/v1/documents/:id
router.get(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const doc = await db('Documents')
      .where({ id, user_id: user.id })
      .select(SAFE_COLUMNS)
      .first();
    if (!doc) throw new AppError(404, 'Document not found');
    res.json({ document: doc });
  }),
);

// PATCH /api/v1/documents/:id
router.patch(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    await getOwnedDoc(id, user.id);

    const { name } = RenameSchema.parse(req.body);
    const [doc] = await db('Documents')
      .where({ id })
      .update({ name, updated_at: new Date() })
      .returning(SAFE_COLUMNS);

    res.json({ document: doc });
  }),
);

// DELETE /api/v1/documents/:id
router.delete(
  '/:id',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const doc = await getOwnedDoc(id, user.id);

    if (doc.r2_key) {
      await deleteObject(doc.r2_key).catch(() => undefined);
    }
    await db('Documents').where({ id: doc.id }).delete();
    res.status(204).send();
  }),
);

// GET /api/v1/documents/:id/download-url
router.get(
  '/:id/download-url',
  requireAuth(),
  asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const { userId } = getAuth(req);
    const user = await getUserByClerkId(userId!);
    const doc = await getOwnedDoc(id, user.id);

    if (!doc.r2_key) throw new AppError(400, 'No file available for this document');
    const url = await generateDownloadUrl(doc.r2_key);
    res.json({ url });
  }),
);

export default router;
