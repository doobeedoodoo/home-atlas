import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { db } from '../../../packages/db/src/knex';
import { AppError } from './errors/AppError';
import usersRouter from './routes/users';
import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';
import { healthLimiter, apiLimiter, chatLimiter } from './middleware/rateLimiter';

const logger = pino();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(pinoHttp());
app.use(express.json());
app.use(clerkMiddleware());

app.get('/health/live', healthLimiter, (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/ready', healthLimiter, async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    logger.error(err, 'DB health check failed');
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

app.use('/api/v1', apiLimiter);
app.use('/api/v1/chat/sessions/:id/messages', chatLimiter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/chat', chatRouter);

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API listening');
});
