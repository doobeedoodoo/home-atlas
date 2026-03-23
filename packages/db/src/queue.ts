import { Queue, Worker, type Job } from 'bullmq';

export interface IngestionJobData {
    documentId: string;
    userId: string;
    r2Key: string;
}

export const INGESTION_QUEUE = 'ingestion';

function getConnectionOptions() {
    const rawUrl = process.env.REDIS_URL;
    if (!rawUrl) throw new Error('REDIS_URL is not set');
    const url = new URL(rawUrl);
    
    return {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
        username: url.username || undefined,
        tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null as null,
    };
}

export function createIngestionQueue() {
    return new Queue<IngestionJobData>(INGESTION_QUEUE, {
        connection: getConnectionOptions(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 200,
        },
    });
}

export function createIngestionWorker(
    processor: (job: Job<IngestionJobData>) => Promise<void>,
) {
    return new Worker<IngestionJobData>(INGESTION_QUEUE, processor, {
        connection: getConnectionOptions(),
        concurrency: 2,
    });
}
