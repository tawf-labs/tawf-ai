export type ScreeningStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ScreeningRecommendation = 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';

export interface ScreeningRequest {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  category?: string;
  language: string;
  status: ScreeningStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreeningResult {
  id: string;
  requestId: string;
  summary: string;
  recommendation: ScreeningRecommendation;
  confidence: number;
  concerns: string[];
  suggestions: string[];
  completedAt?: Date;
  createdAt: Date;
  citations: ScreeningCitation[];
}

export interface ScreeningCitation {
  id: string;
  paperId: string;
  excerpt: string;
  relevance: number;
  paper: {
    id: string;
    title: string;
    source: string;
    url: string;
  };
}

export interface CreateScreeningRequest {
  title: string;
  abstract: string;
  keywords?: string[];
  category?: string;
}

export interface ScreeningFeedback {
  helpful: boolean;
  accuracy?: number;
  comments?: string;
}

export interface ScreeningResponse {
  id: string;
  status: ScreeningStatus;
  estimatedTime?: number;
}
