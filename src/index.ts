import Fastify from 'fastify';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './db/client.js';

/**
 * Tawf-AI Application Entry Point
 */
async function build() {
  const app = Fastify({
    logger: logger,
    trustProxy: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });

  // Register rate limiting
  if (config.api.rateLimit > 0) {
    await app.register(rateLimit, {
      max: config.api.rateLimit,
      timeWindow: '1 minute',
    });
  }

  // Register routes
  await registerRoutes(app);

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}

/**
 * Start the server
 */
async function start() {
  try {
    const app = await build();
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Tawf-AI server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Start server if not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { build };
