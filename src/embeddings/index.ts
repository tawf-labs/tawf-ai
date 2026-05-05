import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../config.js';

export function createEmbeddings() {
  return new OpenAIEmbeddings({
    apiKey: config.embeddings.apiKey,
    ...(config.embeddings.baseUrl
      ? { configuration: { baseURL: config.embeddings.baseUrl } }
      : {}),
    model: config.embeddings.model,
    dimensions: config.embeddings.dimensions,
  });
}

export const embeddings = createEmbeddings();
