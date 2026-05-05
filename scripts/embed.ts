import { embedPaper } from '../src/embeddings/service.js';
import { prisma } from '../src/db/client.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  logger.info('Starting embedding generation...');

  const papers = await prisma.paper.findMany({
    where: { chunks: { none: {} } },
    take: 100,
  });

  logger.info(`Found ${papers.length} papers without embeddings`);

  for (const paper of papers) {
    try {
      const { chunksCreated } = await embedPaper(paper.id);
      logger.info(`Embedded "${paper.title}" → ${chunksCreated} chunks`);
    } catch (error) {
      logger.error(`Failed to embed paper ${paper.id}:`, error);
    }
  }

  logger.info('Done');
  process.exit(0);
}

main().catch((err) => { logger.error(err); process.exit(1); });
