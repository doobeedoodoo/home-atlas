import 'dotenv/config';
import pino from 'pino';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { Job } from 'bullmq';
import { db } from '../../../packages/db/src/knex';
import { createIngestionWorker, type IngestionJobData } from '../../../packages/db/src/queue';
import { downloadObject } from '../../../packages/storage/src';
import { embedTexts } from '../../../packages/ai/src/embeddings';

const logger = pino({ name: 'worker' });

/**
 * 512 token size and 50 tokens overlap might be the sweet spot - but 
 * definitely can be subject to change after testing.
 * 
 * Given each chunk is ~512 tokens, so 100 chunks (EMBED_BATCH) is equal
 * to around 50,000 tokens per request, which is a comfortable margin below
 * the token-per-request limit of the embedding model used.
 */

const CHUNK_SIZE = 2048;   // ~512 tokens (≈4 chars/token)
const CHUNK_OVERLAP = 200; // 50 tokens × ~4 chars/token
const EMBED_BATCH = 100;   // texts per OpenAI embeddings request
const INSERT_BATCH = 50;   // rows per DB insert

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

async function handleIngestion(job: Job<IngestionJobData>): Promise<void> {
  const { documentId, userId, r2Key } = job.data;
  logger.info({ documentId, jobId: job.id }, 'Ingestion started');

  try {
    // 1 — Download PDF from R2
    const pdfBuffer = await downloadObject(r2Key);

    // 2 — Extract text
    const { text, numpages } = await pdf(pdfBuffer);

    console.log('###', { text }) // TODO: remove

    if (!text.trim()) throw new Error('PDF contains no extractable text');

    // 3 — Split into chunks
    const docs = await splitter.createDocuments([text]);

    console.log('###', { docs }) // TODO: remove

    logger.info({ documentId, chunkCount: docs.length }, 'Splitting complete');

    // 4 — Embed in batches
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < docs.length; i += EMBED_BATCH) {
      const batch = docs.slice(i, i + EMBED_BATCH).map((d) => d.pageContent);
      const embeddings = await embedTexts(batch);
      allEmbeddings.push(...embeddings);
      logger.info({ documentId, progress: `${i + batch.length}/${docs.length}` }, 'Embedding batch done');
    }

    // 5 — Bulk insert chunks in a single transaction
    const now = new Date();
    await db.transaction(async (trx) => {
      for (let i = 0; i < docs.length; i += INSERT_BATCH) {
        const slice = docs.slice(i, i + INSERT_BATCH);
        const embedSlice = allEmbeddings.slice(i, i + INSERT_BATCH);

        const cols = '(document_id, user_id, chunk_index, content, embedding, token_count, created_at)';
        const placeholders = slice.map(() => '(?, ?, ?, ?, ?::vector, ?, ?)').join(', ');
        const bindings = slice.flatMap((doc, j) => [
          documentId,
          userId,
          i + j,
          doc.pageContent,
          `[${embedSlice[j]!.join(',')}]`,
          Math.ceil(doc.pageContent.length / 4),
          now,
        ]);

        await trx.raw(
          `INSERT INTO "DocumentChunks" ${cols} VALUES ${placeholders}`,
          bindings,
        );
      }

      // 6 — Mark document ready within the same transaction
      await trx('Documents')
        .where({ id: documentId })
        .update({ status: 'ready', page_count: numpages, updated_at: now });
    });

    logger.info({ documentId, chunkCount: docs.length, numpages }, 'Ingestion complete');
  } catch (err) {
    /**
     * When an error happens, the transaction guarantees that the document is either fully
     * written or not written at all, which keeps the DB consistent.
     * 
     * One disadvantage is for example when an error happens after embedding 90% of the document.
     * This means the API calls goes to waste, but this is an acceptable trade-off for the meantime.
     * 
     * We (if someone wants to contribute :p) can revisit this strategy later on.
     */
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ documentId, err }, 'Ingestion failed');

    await db('Documents')
      .where({ id: documentId })
      .update({ status: 'failed', error_message: message, updated_at: new Date() })
      .catch((dbErr: unknown) => logger.error({ dbErr }, 'Failed to update document status'));

    throw err; // re-throw so BullMQ records the failure and retries
  }
}

const worker = createIngestionWorker(handleIngestion);

worker.on('ready', () => {
  logger.info('Worker connected to Redis');
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed permanently');
});

worker.on('error', (err) => {
  logger.error({ err }, 'Worker connection error');
});

logger.info('Ingestion worker started');
