export interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export interface Citation {
  paperId: string;
  title: string;
  source: string;
  url: string;
  relevance: number;
  excerpt?: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  response: string;
  citations: Citation[];
  sources: string[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}
