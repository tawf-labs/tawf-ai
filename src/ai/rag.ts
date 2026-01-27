import { embeddingService } from '../embeddings/index.js';
import { findSimilarPapers } from '../db/client.js';
import { prisma } from '../db/client.js';
import { config } from '../config.js';

export interface RetrievedDocument {
  paper: {
    id: string;
    title: string;
    source: string;
    url: string;
  };
  similarity: number;
  excerpt: string;
}

export class RAGService {
  /**
   * Retrieve relevant documents for a query
   */
  async retrieve(query: string, topK: number = config.rag.topKResults): Promise<RetrievedDocument[]> {
    // Generate embedding for query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Find similar chunks
    const similarChunks = await findSimilarPapers(
      queryEmbedding,
      topK,
      config.rag.minSimilarityThreshold
    );

    if (similarChunks.length === 0) {
      return [];
    }

    // Get full chunk data with paper info
    const chunkIds = similarChunks.map((c) => c.id);
    const chunks = await prisma.paperChunk.findMany({
      where: { id: { in: chunkIds } },
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

    // Map similarity scores and create result
    const results: RetrievedDocument[] = chunks.map((chunk) => {
      const similarityData = similarChunks.find((s) => s.id === chunk.id);
      return {
        paper: chunk.paper,
        similarity: similarityData?.similarity || 0,
        excerpt: chunk.content,
      };
    });

    // Sort by similarity
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Augment a prompt with retrieved context
   */
  augmentPrompt(query: string, documents: RetrievedDocument[]): string {
    if (documents.length === 0) {
      return query;
    }

    const context = documents
      .map(
        (doc, i) =>
          `[${i + 1}] ${doc.paper.title}\n${doc.excerpt}\nSource: ${doc.paper.source} (${doc.paper.url})`
      )
      .join('\n\n');

    return `CONTEXT FROM SCHOLARLY SOURCES:\n${context}\n\nQUESTION: ${query}`;
  }
}

export const ragService = new RAGService();
