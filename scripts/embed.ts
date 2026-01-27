import { embeddingService } from '../src/embeddings/index.js';
import { prisma } from '../src/db/client.js';
import { logger } from '../src/utils/logger.js';

/**
 * Generate embeddings for existing papers
 * Run with: npm run embed
 */
async function main() {
  logger.info('Starting embedding generation...');

  // Get all papers without embeddings
  const papers = await prisma.paper.findMany({
    where: {
      chunks: {
        none: {},
      },
    },
    take: 100, // Process in batches
  });

  logger.info(`Found ${papers.length} papers without embeddings`);

  for (const paper of papers) {
    try {
      await embeddingService.embedPaper(paper.id);
      logger.info(`Generated embeddings for paper: ${paper.title}`);
    } catch (error) {
      logger.error(`Failed to embed paper ${paper.id}:`, error);
    }
  }

  logger.info('Embedding generation completed!');
  process.exit(0);
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
