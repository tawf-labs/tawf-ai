import { FastifyInstance } from 'fastify';
import { chatService } from '../services/chat.service.js';
import { chatMessageSchema } from '../utils/validator.js';

export async function chatRoutes(app: FastifyInstance) {
  // Send message
  app.post('/', async (request, reply) => {
    const result = chatMessageSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    return chatService.chat(result.data);
  });

  // List conversations
  app.get('/conversations', async (request, reply) => {
    const page = Number((request.query as { page?: string }).page) || 1;
    const limit = Number((request.query as { limit?: string }).limit) || 20;

    return chatService.listConversations({ page, limit });
  });

  // Get conversation history
  app.get('/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = await chatService.getConversation(id);

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    return conversation;
  });

  // Delete conversation
  app.delete('/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await chatService.deleteConversation(id);
    return { message: 'Conversation deleted' };
  });
}
