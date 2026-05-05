import { supabase } from '../db/client.js';
import { aiService } from '../ai/index.js';
import type { ChatRequest, ChatResponse } from '../types/chat.js';

export class ChatService {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationId } = request;

    let convId = conversationId;
    if (convId) {
      const { data } = await supabase.from('Conversation').select('id').eq('id', convId).single();
      if (!data) convId = undefined;
    }
    if (!convId) {
      const { data, error } = await supabase.from('Conversation').insert({}).select('id').single();
      if (error) throw error;
      convId = data!.id;
    }

    const resolvedConvId = convId as string;

    await supabase.from('Message').insert({ conversationId: resolvedConvId, role: 'USER', content: message });

    const { data: history } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', resolvedConvId)
      .order('createdAt', { ascending: true })
      .limit(20);

    const { response, citations } = await aiService.generateResponse(message, history ?? []);

    const { data: assistantMessage, error } = await supabase
      .from('Message')
      .insert({ conversationId: resolvedConvId, role: 'ASSISTANT', content: response, citations })
      .select('id')
      .single();
    if (error) throw error;

    return {
      conversationId: resolvedConvId,
      messageId: assistantMessage.id,
      response,
      citations,
      sources: citations.map((c: any) => c.url).filter(Boolean),
    };
  }

  async listConversations(options: { page: number; limit: number }) {
    const { page, limit } = options;
    const from = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('Conversation')
      .select('*, messages:Message(content,role,createdAt)', { count: 'exact' })
      .order('updatedAt', { ascending: false })
      .limit(1, { referencedTable: 'Message' })
      .range(from, from + limit - 1);    if (error) throw error;

    return {
      data: data ?? [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getConversation(id: string) {
    const { data, error } = await supabase
      .from('Conversation')
      .select('*, messages:Message(*)')
      .eq('id', id)
      .order('createdAt', { referencedTable: 'Message', ascending: true })
      .single();
    if (error) throw error;
    return data;
  }

  async deleteConversation(id: string) {
    const { error } = await supabase.from('Conversation').delete().eq('id', id);
    if (error) throw error;
  }
}

export const chatService = new ChatService();
