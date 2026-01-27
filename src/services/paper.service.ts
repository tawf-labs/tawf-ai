import { prisma, findSimilarPapers } from '../db/client.js';
import type { Paper, PaperSearchResult } from '../types/paper.js';

export class PaperService {
  /**
   * Get paginated list of papers
   */
  async listPapers(options: {
    page: number;
    limit: number;
    source?: string;
    search?: string;
  }) {
    const { page, limit, source, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(source && { source }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [papers, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          source: true,
          url: true,
          author: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.paper.count({ where }),
    ]);

    return {
      data: papers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get paper by ID
   */
  async getPaper(id: string) {
    return prisma.paper.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Semantic search using vector embeddings
   */
  async searchPapers(queryEmbedding: number[], limit: number, threshold: number) {
    const similarChunks = await findSimilarPapers(queryEmbedding, limit, threshold);

    const paperIds = [...new Set(similarChunks.map((c) => c.id))];

    const chunks = await prisma.paperChunk.findMany({
      where: { id: { in: paperIds } },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            source: true,
            url: true,
          },
        },
      },
    });

    const results: PaperSearchResult[] = chunks.map((chunk) => {
      const similarityData = similarChunks.find((s) => s.id === chunk.id);
      return {
        paper: chunk.paper,
        similarity: similarityData?.similarity || 0,
        excerpt: chunk.content.substring(0, 200) + '...',
      };
    });

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Create or update a paper
   */
  async upsertPaper(data: {
    title: string;
    content: string;
    source: string;
    url: string;
    author?: string;
    fatwaNumber?: string;
    publishedAt?: Date;
    language?: string;
  }) {
    return prisma.paper.upsert({
      where: { url: data.url },
      update: data,
      create: {
        ...data,
        language: data.language || 'en',
      },
    });
  }

  /**
   * Delete a paper
   */
  async deletePaper(id: string) {
    return prisma.paper.delete({
      where: { id },
    });
  }

  /**
   * Get statistics
   */
  async getStats() {
    const [papersCount, chunksCount, sources] = await Promise.all([
      prisma.paper.count(),
      prisma.paperChunk.count(),
      prisma.paper.groupBy({
        by: ['source'],
        _count: true,
      }),
    ]);

    return {
      papersIndexed: papersCount,
      chunksCount,
      sources: sources.map((s) => ({ source: s.source, count: s._count })),
    };
  }
}

export const paperService = new PaperService();
