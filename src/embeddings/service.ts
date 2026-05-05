import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { supabase } from '../db/client.js';
import { embeddings } from './index.js';
import { config } from '../config.js';
import { pgVectorConfig } from '../ai/retriever.js';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.rag.chunkSize,
  chunkOverlap: config.rag.chunkOverlap,
});

export async function embedPaper(paperId: string) {
  const { data: paper, error } = await supabase.from('Paper').select('*').eq('id', paperId).single();
  if (error || !paper) throw new Error('Paper not found');

  const docs = await splitter.createDocuments(
    [paper.content],
    [{ paperId, source: paper.source, title: paper.title, url: paper.url }]
  );

  await supabase.from('PaperChunk').delete().eq('paperId', paperId);

  const store = await PGVectorStore.initialize(embeddings, pgVectorConfig);
  await store.addDocuments(docs);
  await store.end();

  return { chunksCreated: docs.length };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}
