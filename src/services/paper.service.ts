import { supabase } from '../db/client.js';
import type { Paper, PaperSearchResult } from '../types/paper.js';

export class PaperService {
  async listPapers(options: { page: number; limit: number; source?: string; search?: string }) {
    const { page, limit, source, search } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('Paper').select('id,title,source,url,author,publishedAt,createdAt', { count: 'exact' });
    if (source) query = query.eq('source', source);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data, count, error } = await query.order('createdAt', { ascending: false }).range(from, to);
    if (error) throw error;

    return {
      data: data ?? [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async getPaper(id: string) {
    const { data, error } = await supabase
      .from('Paper')
      .select('*, chunks:PaperChunk(id,content,chunkIndex)')
      .eq('id', id)
      .order('chunkIndex', { referencedTable: 'PaperChunk', ascending: true })
      .limit(5, { referencedTable: 'PaperChunk' })
      .single();
    if (error) throw error;
    return data;
  }

  async searchPapers(queryEmbedding: number[], limit: number, threshold: number): Promise<PaperSearchResult[]> {
    const { data, error } = await supabase.rpc('match_paper_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      paper: { id: row.paper_id, title: row.title, source: row.source, url: row.url },
      similarity: row.similarity,
      excerpt: row.content.substring(0, 200) + '...',
    }));
  }

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
    const { data: paper, error } = await supabase
      .from('Paper')
      .upsert({ ...data, language: data.language ?? 'en' }, { onConflict: 'url' })
      .select()
      .single();
    if (error) throw error;
    return paper;
  }

  async deletePaper(id: string) {
    const { error } = await supabase.from('Paper').delete().eq('id', id);
    if (error) throw error;
  }

  async getStats() {
    const [{ count: papersCount }, { count: chunksCount }, { data: sources }] = await Promise.all([
      supabase.from('Paper').select('*', { count: 'exact', head: true }),
      supabase.from('PaperChunk').select('*', { count: 'exact', head: true }),
      supabase.from('Paper').select('source'),
    ]);

    const sourceCounts = (sources ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.source] = (acc[row.source] ?? 0) + 1;
      return acc;
    }, {});

    return {
      papersIndexed: papersCount ?? 0,
      chunksCount: chunksCount ?? 0,
      sources: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })),
    };
  }
}

export const paperService = new PaperService();
