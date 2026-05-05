import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { embeddings } from '../embeddings/index.js';
import { config } from '../config.js';

export const pgVectorConfig = {
  postgresConnectionOptions: {
    connectionString: config.database.url,
  },
  tableName: 'PaperChunk',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
};

export async function createFatwaRetrieverTool() {
  const store = await PGVectorStore.initialize(embeddings, pgVectorConfig);
  const retriever = store.asRetriever({
    k: config.rag.topKResults,
    filter: undefined,
  });

  return createRetrieverTool(retriever, {
    name: 'search_fatwa_papers',
    description:
      'Search the local database of Islamic scholarly papers and fatwas. Use this to find relevant rulings, opinions, and citations from trusted Islamic sources.',
  });
}
