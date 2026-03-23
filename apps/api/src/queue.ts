import pino from 'pino';
import { createIngestionQueue } from '../../../packages/db/src/queue';

const logger = pino({ name: 'api:queue' });

/**
 * Singleton! Standard Node.js coolness - modules are singletons by default.
 *
 * When apps/api/src/routes/documents.ts imports from ../queue, Node.js executes queue.ts once,
 * runs createIngestionQueue(), stores the result in the module cache,
 * and returns the same cached module for every subsequent import.
 */
export const ingestionQueue = createIngestionQueue();

ingestionQueue.on('error', (err) => {
  logger.error({ err }, 'Ingestion queue connection error');
});
