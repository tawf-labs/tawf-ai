import { FastifyInstance } from 'fastify';
import { paperService } from '../services/paper.service.js';
import { paperSearchSchema, paperListSchema } from '../utils/validator.js';

export async function papersRoutes(app: FastifyInstance) {
  // List papers
  app.get('/', async (request, reply) => {
    const result = paperListSchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    return paperService.listPapers(result.data);
  });

  // Get paper by ID
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const paper = await paperService.getPaper(id);

    if (!paper) {
      return reply.status(404).send({ error: 'Paper not found' });
    }

    return paper;
  });

  // Semantic search
  app.post('/search', async (request, reply) => {
    const result = paperSearchSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    // Generate embedding for query
    const { embeddingService } = await import('../embeddings/index.js');
    const embedding = await embeddingService.generateEmbedding(result.data.query);

    const papers = await paperService.searchPapers(
      embedding,
      result.data.limit,
      result.data.threshold
    );

    return { results: papers };
  });

  // Delete paper (admin only)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await paperService.deletePaper(id);
    return { message: 'Paper deleted' };
  });
}
