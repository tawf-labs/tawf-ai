import { FastifyInstance } from 'fastify';
import { screeningService } from '../services/screening.service.js';
import { screeningRequestSchema, screeningFeedbackSchema } from '../utils/validator.js';

export async function screeningRoutes(app: FastifyInstance) {
  // Submit proposal for screening
  app.post('/proposal', async (request, reply) => {
    const result = screeningRequestSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    return screeningService.submitProposal(result.data);
  });

  // Get screening result
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await screeningService.getResult(id);

    if (!result) {
      return reply.status(404).send({ error: 'Screening request not found' });
    }

    return result;
  });

  // Submit feedback
  app.post('/:id/feedback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = screeningFeedbackSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    return screeningService.submitFeedback(id, result.data);
  });
}
