import { config } from '../config.js';

/**
 * Rate limiting configuration
 * Note: Actual rate limiting is handled by @fastify/rate-limit plugin
 * This file exports additional rate limit configurations for different routes
 */
export const rateLimitConfig = {
  // Strict rate limit for expensive operations
  strict: {
    max: 10,
    timeWindow: '1 minute' as const,
  },

  // Moderate rate limit for general API calls
  moderate: {
    max: 30,
    timeWindow: '1 minute' as const,
  },

  // Relaxed rate limit for read operations
  relaxed: {
    max: 100,
    timeWindow: '1 minute' as const,
  },

  // Rate limit for scraping (very strict)
  scraping: {
    max: 1,
    timeWindow: '10 seconds' as const,
  },
};

export const getRateLimitByRoute = (route: string) => {
  if (route.startsWith('/api/v1/scrape')) {
    return rateLimitConfig.scraping;
  }
  if (route.startsWith('/api/v1/screening')) {
    return rateLimitConfig.strict;
  }
  if (route.startsWith('/api/v1/chat')) {
    return rateLimitConfig.moderate;
  }
  return rateLimitConfig.relaxed;
};
