import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes.js';
import { papersRoutes } from './papers.routes.js';
import { chatRoutes } from './chat.routes.js';
import { screeningRoutes } from './screening.routes.js';
import { scrapeRoutes } from './scrape.routes.js';
import { supabase } from '../db/client.js';

export async function registerRoutes(app: FastifyInstance) {
  // Health check (no auth)
  await app.register(healthRoutes, { prefix: '/' });

  // API routes
  await app.register(papersRoutes, { prefix: '/api/v1/papers' });
  await app.register(chatRoutes, { prefix: '/api/v1/chat' });
  await app.register(screeningRoutes, { prefix: '/api/v1/screening' });
  await app.register(scrapeRoutes, { prefix: '/api/v1/scrape' });

  // Status endpoint
  app.get('/api/v1/status', async () => {
    const { paperService } = await import('../services/paper.service.js');

    const [stats, { count: conversationsCount }] = await Promise.all([
      paperService.getStats(),
      supabase.from('Conversation').select('*', { count: 'exact', head: true }),
    ]);

    return {
      papersIndexed: stats.papersIndexed,
      conversationsCount,
      sources: stats.sources,
      version: '1.0.0',
    };
  });
}
