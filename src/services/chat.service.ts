import { prisma } from '../db/client.js';
import { aiService } from '../ai/index.js';
import type { ChatRequest, ChatResponse } from '../types/chat.js';

export class ChatService {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationId } = request;

    const conversation = conversationId
      ? (await prisma.conversation.findUnique({ where: { id: conversationId } })) ??
        (await prisma.conversation.create({ data: {} }))
      : await prisma.conversation.create({ data: {} });

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'USER', content: message },
    });

    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const { response, citations } = await aiService.generateResponse(message, history);

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response,
        citations: citations as any,
      },
    });

    return {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      response,
      citations,
      sources: citations.map((c) => c.url).filter(Boolean),
    };
  }

  async listConversations(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.conversation.count(),
    ]);
    return { data: conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getConversation(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async deleteConversation(id: string) {
    return prisma.conversation.delete({ where: { id } });
  }
}

export const chatService = new ChatService();
