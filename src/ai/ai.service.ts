import { config } from '../config.js';
import { qwenClient } from './qwen.client.js';
import { ragService } from './rag.js';
import { getSystemPrompt } from './prompts.js';
import type { Citation } from '../types/chat.js';
import type { Message } from '@prisma/client';

export interface GenerateResponseOptions {
  message: string;
  history: Message[];
}

export interface GenerateResponseResult {
  response: string;
  citations: Citation[];
}

export interface ScreenProposalOptions {
  title: string;
  abstract: string;
  keywords: string[];
  category?: string;
}

export interface ScreenProposalResult {
  summary: string;
  recommendation: 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
  confidence: number;
  concerns: string[];
  suggestions: string[];
  citations: Array<{
    paperId: string;
    excerpt: string;
    relevance: number;
  }>;
}

export class AIService {
  /**
   * Generate response using RAG
   */
  async generateResponse(
    message: string,
    history: Message[]
  ): Promise<GenerateResponseResult> {
    // Retrieve relevant documents
    const relevantDocs = await ragService.retrieve(message, config.rag.topKResults);

    // Build context from retrieved documents
    const context = this.buildContext(relevantDocs);

    // Format conversation history
    const conversationHistory = this.formatHistory(history);

    // Generate response
    const response = await qwenClient.generate({
      prompt: message,
      context,
      history: conversationHistory,
      systemPrompt: getSystemPrompt('chat'),
    });

    // Extract citations
    const citations: Citation[] = relevantDocs.map((doc: any) => ({
      paperId: doc.paper.id,
      title: doc.paper.title,
      source: doc.paper.source,
      url: doc.paper.url,
      relevance: doc.similarity,
      excerpt: doc.excerpt,
    }));

    return {
      response,
      citations,
    };
  }

  /**
   * Screen a proposal
   */
  async screenProposal(options: ScreenProposalOptions): Promise<ScreenProposalResult> {
    const { title, abstract, keywords, category } = options;

    // Build search query
    const query = `${title} ${abstract} ${keywords.join(' ')}`;

    // Retrieve relevant documents
    const relevantDocs = await ragService.retrieve(query, config.rag.topKResults);

    // Build context
    const context = this.buildContext(relevantDocs);

    // Generate screening
    const prompt = this.buildScreeningPrompt(title, abstract, keywords, category);

    const response = await qwenClient.generate({
      prompt,
      context,
      systemPrompt: getSystemPrompt('screening'),
    });

    // Parse response (structured output)
    return this.parseScreeningResponse(response, relevantDocs);
  }

  /**
   * Build context from retrieved documents
   */
  private buildContext(docs: any[]): string {
    if (docs.length === 0) {
      return 'No relevant scholarly sources found.';
    }

    return docs
      .map(
        (doc, i) =>
          `[Source ${i + 1}]: ${doc.paper.title}\n${doc.excerpt}\nSource: ${doc.paper.source}`
      )
      .join('\n\n');
  }

  /**
   * Format conversation history
   */
  private formatHistory(history: Message[]): string {
    return history
      .map((msg) => `${msg.role === 'USER' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Build screening prompt
   */
  private buildScreeningPrompt(
    title: string,
    abstract: string,
    keywords: string[],
    category?: string
  ): string {
    return `Please evaluate the following proposal:

Title: ${title}

Abstract: ${abstract}

Keywords: ${keywords.join(', ')}

${category ? `Category: ${category}` : ''}

Provide:
1. A summary of your evaluation
2. A recommendation (APPROVED, CONDITIONALLY_APPROVED, NEEDS_REVIEW, or REJECTED)
3. Your confidence level (0-1)
4. Any concerns
5. Suggestions for improvement`;
  }

  /**
   * Parse screening response
   */
  private parseScreeningResponse(response: string, docs: any[]): ScreenProposalResult {
    // In production, use structured output or parse JSON response
    // For now, return a basic structure

    return {
      summary: response.substring(0, 500),
      recommendation: 'NEEDS_REVIEW',
      confidence: 0.7,
      concerns: [],
      suggestions: [],
      citations: docs.slice(0, 3).map((doc: any) => ({
        paperId: doc.paper.id,
        excerpt: doc.excerpt,
        relevance: doc.similarity,
      })),
    };
  }
}
