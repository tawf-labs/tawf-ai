import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config.js';

export function createThauraModel(overrides?: Partial<ConstructorParameters<typeof ChatOpenAI>[0]>) {
  return new ChatOpenAI({
    apiKey: config.thaura.apiKey,
    configuration: { baseURL: config.thaura.baseUrl },
    model: config.thaura.model,
    temperature: config.thaura.temperature,
    ...overrides,
  });
}

export const thauraModel = createThauraModel();
