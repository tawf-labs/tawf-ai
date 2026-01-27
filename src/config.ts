import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: join(__dirname, '../.env') });

interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
  database: {
    url: string;
  };
  ai: {
    provider: 'ollama' | 'openai' | 'qwen';
    ollama: {
      baseUrl: string;
      model: string;
      embeddingModel: string;
    };
    openai: {
      apiKey: string;
      model: string;
      embeddingModel: string;
    };
  };
  embeddings: {
    provider: 'ollama' | 'openai' | 'huggingface';
    dimensions: number;
    batchSize: number;
  };
  scraper: {
    userAgent: string;
    concurrency: number;
    delayMs: number;
    timeoutMs: number;
    maxPages: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    topKResults: number;
    minSimilarityThreshold: number;
  };
  api: {
    keyEnabled: boolean;
    key: string;
    rateLimit: number;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  features: {
    scraper: boolean;
    screening: boolean;
    chat: boolean;
  };
}

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsed = value ? parseInt(value, 10) : defaultValue;
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringArray(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export const config: Config = {
  port: parseNumber(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  ai: {
    provider: (process.env.AI_PROVIDER as 'ollama' | 'openai' | 'qwen') || 'ollama',
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen2.5:14b',
      embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    },
  },

  embeddings: {
    provider: (process.env.EMBEDDING_PROVIDER as 'ollama' | 'openai' | 'huggingface') || 'ollama',
    dimensions: parseNumber(process.env.EMBEDDING_DIMENSIONS, 768),
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
    minSimilarityThreshold: parseNumber(process.env.MIN_SIMILARITY_THRESHOLD, 0.7),
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
