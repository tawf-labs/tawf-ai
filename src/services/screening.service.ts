import { supabase } from '../db/client.js';
import { aiService } from '../ai/index.js';
import type {
  CreateScreeningRequest,
  ScreeningResponse,
  ScreeningResult as ScreeningResultType,
} from '../types/screening.js';

export class ScreeningService {
  async submitProposal(data: CreateScreeningRequest): Promise<ScreeningResponse> {
    const { data: request, error } = await supabase
      .from('ScreeningRequest')
      .insert({
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords ?? [],
        category: data.category,
        status: 'PROCESSING',
      })
      .select('id')
      .single();
    if (error) throw error;

    this.processScreening(request.id).catch((err) =>
      console.error(`Screening failed for ${request.id}:`, err)
    );

    return { id: request.id, status: 'PROCESSING', estimatedTime: 30 };
  }

  private async processScreening(requestId: string) {
    const { data: request } = await supabase
      .from('ScreeningRequest')
      .select('*')
      .eq('id', requestId)
      .single();
    if (!request) throw new Error('Screening request not found');

    try {
      const result = await aiService.screenProposal({
        title: request.title,
        abstract: request.abstract,
        keywords: request.keywords,
        category: request.category ?? undefined,
      });

      const citationRecords = await Promise.all(
        result.citations.map(async (c: any) => {
          const { data: paper } = await supabase
            .from('Paper')
            .select('id')
            .eq('url', c.source)
            .single();
          return paper ? { paperId: paper.id, excerpt: c.excerpt, relevance: c.relevance } : null;
        })
      );

      const { data: screeningResult, error: resultError } = await supabase
        .from('ScreeningResult')
        .insert({
          requestId: request.id,
          summary: result.summary,
          recommendation: result.recommendation,
          confidence: result.confidence,
          concerns: result.concerns,
          suggestions: result.suggestions,
          completedAt: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (resultError) throw resultError;

      const validCitations = citationRecords.filter(Boolean).map((c) => ({
        ...c!,
        resultId: screeningResult.id,
      }));
      if (validCitations.length > 0) {
        await supabase.from('ScreeningCitation').insert(validCitations);
      }

      await supabase.from('ScreeningRequest').update({ status: 'COMPLETED' }).eq('id', requestId);
    } catch (error) {
      await supabase.from('ScreeningRequest').update({ status: 'FAILED' }).eq('id', requestId);
      throw error;
    }
  }

  async getResult(id: string): Promise<ScreeningResultType | null> {
    const { data: request } = await supabase
      .from('ScreeningRequest')
      .select(`*, result:ScreeningResult(*, citations:ScreeningCitation(*, paper:Paper(id,title,source,url)))`)
      .eq('id', id)
      .single();

    if (!request) return null;
    if (!request.result) {
      return {
        id: '',
        requestId: request.id,
        summary: '',
        recommendation: 'NEEDS_REVIEW',
        confidence: 0,
        concerns: [],
        suggestions: [],
        createdAt: request.createdAt,
        citations: [],
      };
    }

    const r = request.result;
    return {
      id: r.id,
      requestId: request.id,
      summary: r.summary,
      recommendation: r.recommendation,
      confidence: r.confidence,
      concerns: r.concerns,
      suggestions: r.suggestions,
      createdAt: r.createdAt,
      citations: r.citations.map((c: any) => ({
        id: c.id,
        paperId: c.paperId,
        excerpt: c.excerpt,
        relevance: c.relevance,
        paper: c.paper,
      })),
    };
  }

  async submitFeedback(_id: string, _feedback: { helpful: boolean; comments?: string }) {
    return { message: 'Feedback recorded' };
  }
}

export const screeningService = new ScreeningService();
