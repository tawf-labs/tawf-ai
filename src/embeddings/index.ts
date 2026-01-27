import { EmbeddingGenerator } from './generator.js';

export class EmbeddingService {
  private generator: EmbeddingGenerator;

  constructor() {
    this.generator = new EmbeddingGenerator();
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.generator.embed(text);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.generator.embedBatch(texts);
  }

  /**
   * Generate and store embeddings for a paper
   */
  async embedPaper(paperId: string) {
    const { prisma } = await import('../db/client.js');
    const { config } = await import('../config.js');

    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      throw new Error('Paper not found');
    }

    // Chunk the paper content
    const chunks = this.chunkText(paper.content, config.rag.chunkSize, config.rag.chunkOverlap);

    // Generate embeddings for each chunk
    const embeddings = await this.generateEmbeddings(chunks);

    // Store chunks with embeddings
    await prisma.paperChunk.deleteMany({
      where: { paperId },
    });

    for (let i = 0; i < chunks.length; i++) {
      // Use raw SQL for pgvector insert
      await prisma.$executeRawUnsafe(`
        INSERT INTO "PaperChunk" ("id", "paperId", "content", "chunkIndex", "embedding", "createdAt")
        VALUES (cuid(), $1, $2, $3, $4, NOW())
      `, paperId, chunks[i], i, `[${embeddings[i].join(',')}]`);
    }

    return { chunksCreated: chunks.length };
  }

  /**
   * Split text into chunks
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.substring(start, end));
      start = end - overlap;
    }

    return chunks;
  }
}

export const embeddingService = new EmbeddingService();
