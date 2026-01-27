import { Ollama } from 'ollama';
import OpenAI from 'openai';
import { config } from '../config.js';

export interface GenerateOptions {
  prompt: string;
  context?: string;
  history?: string;
  systemPrompt?: string;
}

export class QwenClient {
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
   * Generate response
   */
  async generate(options: GenerateOptions): Promise<string> {
    const { prompt, context, history, systemPrompt } = options;

    let fullPrompt = '';

    if (systemPrompt) {
      fullPrompt += `System: ${systemPrompt}\n\n`;
    }

    if (context) {
      fullPrompt += `Context:\n${context}\n\n`;
    }

    if (history) {
      fullPrompt += `Conversation History:\n${history}\n\n`;
    }

    fullPrompt += `User: ${prompt}`;

    switch (config.ai.provider) {
      case 'ollama':
        return this.generateWithOllama(fullPrompt);

      case 'openai':
        return this.generateWithOpenAI(prompt, context, history, systemPrompt);

      default:
        throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
    }
  }

  /**
   * Generate using Ollama
   */
  private async generateWithOllama(prompt: string): Promise<string> {
    const response = await this.ollama.generate({
      model: config.ai.ollama.model,
      prompt,
      stream: false,
    });

    return response.response;
  }

  /**
   * Generate using OpenAI
   */
  private async generateWithOpenAI(
    prompt: string,
    context?: string,
    history?: string,
    systemPrompt?: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (context) {
      messages.push({
        role: 'system',
        content: `Use the following context to answer:\n${context}`,
      });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: config.ai.openai.model,
      messages,
    });

    return response.choices[0]?.message?.content || '';
  }
}

export const qwenClient = new QwenClient();
