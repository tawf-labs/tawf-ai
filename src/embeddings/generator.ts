import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { config } from '../config.js';

export class EmbeddingGenerator {
  private ollama: Ollama;
  private openai: OpenAI | null = null;

  constructor() {
    this.ollama = new Ollama({ host: config.ai.ollama.baseUrl });

    if (config.ai.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.ai.openai.apiKey,
      });
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    switch (config.embeddings.provider) {
      case 'ollama':
        return this.embedWithOllama(text);

      case 'openai':
        return this.embedWithOpenAI(text);

      default:
        throw new Error(`Unsupported embedding provider: ${config.embeddings.provider}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const batchSize = config.embeddings.batchSize;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddings = await Promise.all(batch.map((text) => this.embed(text)));
      results.push(...embeddings);
    }

    return results;
  }

  /**
   * Generate embedding using Ollama
   */
  private async embedWithOllama(text: string): Promise<number[]> {
    const response = await this.ollama.embeddings({
      model: config.ai.ollama.embeddingModel,
      prompt: text,
    });

    return response.embedding;
  }

  /**
   * Generate embedding using OpenAI
   */
  private async embedWithOpenAI(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.openai.embeddings.create({
      model: config.ai.openai.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }
}
