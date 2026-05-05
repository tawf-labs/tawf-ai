import { embedPaper } from '../src/embeddings/service.js';
import { supabase } from '../src/db/client.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  logger.info('Starting embedding generation...');

  const { data: papers, error } = await supabase
    .from('Paper')
    .select('id,title')
    .not('id', 'in', supabase.from('PaperChunk').select('paperId'))
    .limit(100);
  if (error) throw error;

  logger.info(`Found ${papers?.length ?? 0} papers without embeddings`);

  for (const paper of papers ?? []) {
    try {
      const { chunksCreated } = await embedPaper(paper.id);
      logger.info(`Embedded "${paper.title}" → ${chunksCreated} chunks`);
    } catch (err) {
      logger.error(`Failed to embed paper ${paper.id}:`, err);
    }
  }

  logger.info('Done');
  process.exit(0);
}

main().catch((err) => { logger.error(err); process.exit(1); });
