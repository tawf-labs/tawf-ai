import { FastifyInstance } from 'fastify';
import { scraper } from '../scraper/index.js';
import { scrapeTriggerSchema } from '../utils/validator.js';

export async function scrapeRoutes(app: FastifyInstance) {
  // Trigger scraping
  app.post('/trigger', async (request, reply) => {
    const result = scrapeTriggerSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation Error', details: result.error });
    }

    // Start scraping asynchronously
    scraper.scrapeAll(result.data.sources).catch((error) => {
      console.error('Scraping error:', error);
    });

    return {
      jobId: `job_${Date.now()}`,
      status: 'started',
      sourcesCount: result.data.sources?.length || scraper.sources.length,
    };
  });

  // Get scraping status
  app.get('/status', async () => {
    const jobs = await scraper.getActiveJobs();
    return {
      status: jobs.length > 0 ? 'running' : 'idle',
      activeJobs: jobs.length,
      completedJobs: await scraper.getCompletedCount(),
      failedJobs: await scraper.getFailedCount(),
      totalPapers: await scraper.getTotalPapers(),
    };
  });

  // Get available sources
  app.get('/sources', async () => {
    return {
      sources: scraper.sources.map((s) => ({
        name: s.name,
        enabled: s.enabled,
      })),
    };
  });
}
