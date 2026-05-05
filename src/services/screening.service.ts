import { prisma } from '../db/client.js';
import { aiService } from '../ai/index.js';
import type {
  CreateScreeningRequest,
  ScreeningResponse,
  ScreeningResult as ScreeningResultType,
} from '../types/screening.js';

export class ScreeningService {
  async submitProposal(data: CreateScreeningRequest): Promise<ScreeningResponse> {
    const request = await prisma.screeningRequest.create({
      data: {
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords || [],
        category: data.category,
        status: 'PROCESSING',
      },
    });

    this.processScreening(request.id).catch((err) =>
      console.error(`Screening failed for ${request.id}:`, err)
    );

    return { id: request.id, status: 'PROCESSING', estimatedTime: 30 };
  }

  private async processScreening(requestId: string) {
    const request = await prisma.screeningRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Screening request not found');

    try {
      const result = await aiService.screenProposal({
        title: request.title,
        abstract: request.abstract,
        keywords: request.keywords,
        category: request.category ?? undefined,
      });

      // Find papers matching citation sources for DB linking
      const citationRecords = await Promise.all(
        result.citations.map(async (c) => {
          const paper = await prisma.paper.findFirst({ where: { url: c.source } });
          return { paperId: paper?.id ?? null, excerpt: c.excerpt, relevance: c.relevance };
        })
      );

      const validCitations = citationRecords.filter((c) => c.paperId !== null) as Array<{
        paperId: string;
        excerpt: string;
        relevance: number;
      }>;

      await prisma.screeningResult.create({
        data: {
          requestId: request.id,
          summary: result.summary,
          recommendation: result.recommendation,
          confidence: result.confidence,
          concerns: result.concerns,
          suggestions: result.suggestions,
          completedAt: new Date(),
          citations: { create: validCitations },
        },
      });

      await prisma.screeningRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      });
    } catch (error) {
      await prisma.screeningRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  async getResult(id: string): Promise<ScreeningResultType | null> {
    const request = await prisma.screeningRequest.findUnique({
      where: { id },
      include: {
        result: {
          include: {
            citations: {
              include: { paper: { select: { id: true, title: true, source: true, url: true } } },
            },
          },
        },
      },
    });

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

    return {
      id: request.result.id,
      requestId: request.id,
      summary: request.result.summary,
      recommendation: request.result.recommendation as any,
      confidence: request.result.confidence,
      concerns: request.result.concerns,
      suggestions: request.result.suggestions,
      createdAt: request.result.createdAt,
      citations: request.result.citations.map((c) => ({
        id: c.id,
        paperId: c.paperId,
        excerpt: c.excerpt,
        relevance: c.relevance,
        paper: c.paper as any,
      })),
    };
  }

  async submitFeedback(_id: string, _feedback: { helpful: boolean; comments?: string }) {
    return { message: 'Feedback recorded' };
  }
}

export const screeningService = new ScreeningService();
