import { z } from 'zod';

// Paper schemas
export const paperSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
});

export const paperListSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  source: z.string().optional(),
  search: z.string().optional(),
});

// Chat schemas
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export const conversationListSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

// Screening schemas
export const screeningRequestSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().min(1),
  keywords: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
});

export const screeningFeedbackSchema = z.object({
  helpful: z.boolean(),
  accuracy: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
});

// Scraper schemas
export const scrapeTriggerSchema = z.object({
  sources: z.array(z.string()).optional(),
  force: z.boolean().optional().default(false),
});

// Export types
export type PaperSearchInput = z.infer<typeof paperSearchSchema>;
export type PaperListInput = z.infer<typeof paperListSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ConversationListInput = z.infer<typeof conversationListSchema>;
export type ScreeningRequestInput = z.infer<typeof screeningRequestSchema>;
export type ScreeningFeedbackInput = z.infer<typeof screeningFeedbackSchema>;
export type ScrapeTriggerInput = z.infer<typeof scrapeTriggerSchema>;
