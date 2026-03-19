import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { db } from '../../../packages/db/src/knex';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(pinoHttp());
app.use(express.json());

app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/ready', async (_req, res) => {
    try {
        await db.raw('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'error', db: 'unreachable' });
    }
});

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});