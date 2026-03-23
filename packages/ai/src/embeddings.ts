import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * text-embedding-3-small natively produces 1536-dimensional vectors.
 * This value is also set in DocumentChunks migration, both must match,
 * or else pgvector will reject the insert.
 */
const EMBEDDING_DIMENSIONS = 1536;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

/**
 * Embeds a batch of texts using text-embedding-3-small.
 * Returns one 1536-dim vector per input, in the same order.
 * Max ~100 texts per call to stay within API token limits.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  
  // API returns results in the same order as input
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
