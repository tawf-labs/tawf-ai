import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, '../.env') });

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = value ? parseInt(value, 10) : defaultValue;
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config = {
  port: parseNumber(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  thaura: {
    apiKey: process.env.THAURA_API_KEY || '',
    baseUrl: process.env.THAURA_BASE_URL || 'https://backend.thaura.ai/v1',
    model: 'thaura',
    temperature: parseFloat(process.env.THAURA_TEMPERATURE || '0.7'),
  },

  tavily: {
    apiKey: process.env.TAVILY_API_KEY || '',
    maxResults: parseNumber(process.env.TAVILY_MAX_RESULTS, 5),
  },

  embeddings: {
    // Uses OpenAI-compatible embeddings; point at any compatible endpoint
    apiKey: process.env.EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.EMBEDDINGS_BASE_URL || undefined,
    model: process.env.EMBEDDINGS_MODEL || 'text-embedding-3-small',
    dimensions: parseNumber(process.env.EMBEDDING_DIMENSIONS, 1536),
    batchSize: parseNumber(process.env.EMBEDDING_BATCH_SIZE, 10),
  },

  scraper: {
    userAgent: process.env.SCRAPER_USER_AGENT || 'Tawf-AI/1.0',
    concurrency: parseNumber(process.env.SCRAPER_CONCURRENCY, 3),
    delayMs: parseNumber(process.env.SCRAPER_DELAY_MS, 1000),
    timeoutMs: parseNumber(process.env.SCRAPER_TIMEOUT_MS, 30000),
    maxPages: parseNumber(process.env.SCRAPER_MAX_PAGES, 100),
  },

  rag: {
    chunkSize: parseNumber(process.env.CHUNK_SIZE, 1000),
    chunkOverlap: parseNumber(process.env.CHUNK_OVERLAP, 200),
    topKResults: parseNumber(process.env.TOP_K_RESULTS, 5),
    minSimilarityThreshold: parseFloat(process.env.MIN_SIMILARITY_THRESHOLD || '0.7'),
  },

  api: {
    keyEnabled: parseBoolean(process.env.API_KEY_ENABLED || 'false'),
    key: process.env.API_KEY || '',
    rateLimit: parseNumber(process.env.API_RATE_LIMIT, 100),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: parseBoolean(process.env.CORS_CREDENTIALS || 'true'),
  },

  features: {
    scraper: process.env.ENABLE_SCRAPER !== 'false',
    screening: process.env.ENABLE_SCREENING !== 'false',
    chat: process.env.ENABLE_CHAT !== 'false',
  },
};
