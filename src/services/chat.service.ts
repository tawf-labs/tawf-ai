import { prisma } from '../db/client.js';
import { aiService } from '../ai/index.js';
import type { ChatRequest, ChatResponse } from '../types/chat.js';

export class ChatService {
  /**
   * Send a message and get AI response with citations
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationId } = request;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {},
      });
    }

    // Store user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // Get conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Generate response using AI service with RAG
    const { response, citations } = await aiService.generateResponse(message, history);

    // Store assistant message
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
      sources: citations.map((c) => c.url),
    };
  }

  /**
   * List conversations
   */
  async listConversations(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.conversation.count(),
    ]);

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation history
   */
  async getConversation(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Delete conversation
   */
  async deleteConversation(id: string) {
    return prisma.conversation.delete({
      where: { id },
    });
  }
}

export const chatService = new ChatService();
