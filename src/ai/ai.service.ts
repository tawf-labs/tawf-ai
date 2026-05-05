import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { getChatGraph } from './chat.graph.js';
import { getScreeningGraph, parseScreeningOutput } from './screening.graph.js';
import type { Citation } from '../types/chat.js';
import type { Message } from '../types/chat.js';

export interface ScreenProposalResult {
  summary: string;
  recommendation: 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
  confidence: number;
  concerns: string[];
  suggestions: string[];
  citations: Array<{ source: string; excerpt: string; relevance: number }>;
}

export class AIService {
  async generateResponse(
    message: string,
    history: Message[]
  ): Promise<{ response: string; citations: Citation[] }> {
    const graph = await getChatGraph();

    // Build message list from history + new message
    const messages = [
      ...history.map((m) =>
        m.role === 'USER' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(message),
    ];

    const result = await graph.invoke({ messages });

    const lastAI = [...result.messages].reverse().find(AIMessage.isInstance);
    const response = typeof lastAI?.content === 'string' ? lastAI.content : '';

    // Extract citations from tool messages (Tavily + retriever results)
    const citations = this.extractCitations(result.messages);

    return { response, citations };
  }

  async screenProposal(options: {
    title: string;
    abstract: string;
    keywords: string[];
    category?: string;
  }): Promise<ScreenProposalResult> {
    const graph = await getScreeningGraph();

    const prompt = `Evaluate this proposal for Sharia compliance:

Title: ${options.title}
Abstract: ${options.abstract}
Keywords: ${options.keywords.join(', ')}${options.category ? `\nCategory: ${options.category}` : ''}`;

    const result = await graph.invoke({ messages: [new HumanMessage(prompt)] });

    const lastAI = [...result.messages].reverse().find(AIMessage.isInstance);
    const content = typeof lastAI?.content === 'string' ? lastAI.content : '';

    return parseScreeningOutput(content);
  }

  private extractCitations(messages: any[]): Citation[] {
    const citations: Citation[] = [];
    for (const msg of messages) {
      if (msg.name === 'search_fatwa_papers' || msg.name === 'tavily_search_results') {
        try {
          const results = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
          if (Array.isArray(results)) {
            for (const r of results) {
              citations.push({
                paperId: r.id ?? '',
                title: r.title ?? r.name ?? 'Source',
                source: r.source ?? r.url ?? '',
                url: r.url ?? '',
                relevance: r.score ?? 0.8,
                excerpt: r.pageContent ?? r.content ?? r.snippet ?? '',
              });
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return citations;
  }
}

export const aiService = new AIService();
