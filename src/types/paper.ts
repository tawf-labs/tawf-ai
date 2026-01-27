export interface Paper {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  author?: string;
  fatwaNumber?: string;
  publishedAt?: Date;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaperChunk {
  id: string;
  paperId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PaperSearchResult {
  paper: {
    id: string;
    title: string;
    source: string;
    url: string;
  };
  similarity: number;
  excerpt: string;
}

export interface FatwaSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  paperSelector: string;
  titleSelector: string;
  contentSelector: string;
  urlPattern?: RegExp;
}
