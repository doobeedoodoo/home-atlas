/**
 * One-off retrieval smoke test.
 *
 * Usage:
 *   QUERY="How do I descale my coffee maker?" npx tsx src/scripts/test-retrieval.ts
 *
 * Optional env vars:
 *   TOP_K      – number of chunks to return (default: 5)
 *   THRESHOLD  – minimum cosine similarity 0–1 (default: 0.0, no filter)
 *   USER_ID    – restrict search to one user's documents (default: all users)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { db } from '../../../../packages/db/src/knex';

const OUTPUT_DIR = path.resolve(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'retrieval-output.txt');

const query   = process.env.QUERY;
const topK    = Number(process.env.TOP_K ?? 5);
const threshold = Number(process.env.THRESHOLD ?? 0.0);
const userId  = process.env.USER_ID ?? null;

if (!query) {
  console.error('Error: set the QUERY environment variable before running.');
  process.exit(1);
}

async function main() {
  // 1 — Embed the query
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query!,
    dimensions: 1536,
  });
  const vector = embeddingRes.data[0]!.embedding;
  const vectorLiteral = `[${vector.join(',')}]`;

  const lines: string[] = [];
  const log = (line = '') => { console.log(line); lines.push(line); };

  log(`\nQuery : "${query}"`);
  log(`Top-K : ${topK}  |  Threshold : ${threshold}  |  User filter : ${userId ?? 'none'}\n`);

  // 2 — pgvector cosine similarity search
  //     1 - (embedding <=> query_vec) converts distance to similarity score
  const userFilter = userId ? `AND dc.user_id = ?` : '';
  const bindings: unknown[] = [vectorLiteral, topK];
  if (userId) bindings.splice(1, 0, userId); // insert before topK

  const { rows } = await db.raw<{ rows: Array<{
    chunk_index: number;
    score: number;
    content: string;
    document_name: string;
    document_id: string;
  }> }>(
    `
    SELECT
      dc.chunk_index,
      1 - (dc.embedding <=> ?::vector)  AS score,
      dc.content,
      d.name                             AS document_name,
      dc.document_id
    FROM   "DocumentChunks" dc
    JOIN   "Documents"      d  ON d.id = dc.document_id
    WHERE  1 - (dc.embedding <=> ?::vector) >= ?
    ${userFilter}
    ORDER  BY dc.embedding <=> ?::vector
    LIMIT  ?
    `,
    [vectorLiteral, vectorLiteral, threshold, ...(userId ? [userId] : []), vectorLiteral, topK],
  );

  if (rows.length === 0) {
    log('No chunks found. Check that documents have been ingested and the threshold is not too high.');
  } else {
    for (const [i, row] of rows.entries()) {
      log(`── Chunk ${i + 1} ────────────────────────────────────────────────`);
      log(`   Document   : ${row.document_name} (${row.document_id})`);
      log(`   Chunk index: ${row.chunk_index}`);
      log(`   Score      : ${Number(row.score).toFixed(4)}`);
      const preview = row.content.trim().replace(/\s+/g, ' ');
      log(`   Content    : ${preview}`);
      log();
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'));
  console.log(`\nOutput written to ${OUTPUT_FILE}`);

  if (rows.length > 0) {
    const contextBlock = rows
      .map((row, i) => {
        const content = row.content.trim().replace(/\s+/g, ' ');
        return `[${i + 1}] Source: "${row.document_name}", chunk ${row.chunk_index} (score: ${Number(row.score).toFixed(4)})\n${content}`;
      })
      .join('\n\n');

    const prompt = [
      'You are a helpful assistant. Answer the user\'s question using ONLY the context provided below.',
      'If the answer cannot be found in the context, say so clearly.',
      'Cite the source number(s) (e.g. [1], [2]) next to each piece of information you use.',
      '',
      '--- CONTEXT ---',
      contextBlock,
      '--- END CONTEXT ---',
      '',
      `User question: ${query}`,
    ].join('\n');

    const PROMPT_FILE = path.join(OUTPUT_DIR, 'retrieval-output-prompt.txt');
    fs.writeFileSync(PROMPT_FILE, prompt);
    console.log(`Prompt written to  ${PROMPT_FILE}`);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.destroy());
