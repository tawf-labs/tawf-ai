import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections due to hot reloading in Next.js/Vite
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper for vector similarity search
export async function findSimilarPapers(
  embedding: number[],
  limit: number = 5,
  threshold: number = 0.7
) {
  // Using raw SQL for pgvector cosine similarity
  const results = await prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
    SELECT
      pc.id,
      1 - (pc.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM "PaperChunk" pc
    WHERE pc.embedding IS NOT NULL
      AND (1 - (pc.embedding <=> ${JSON.stringify(embedding)}::vector)) > ${threshold}
    ORDER BY pc.embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${limit}
  `;

  return results;
}
