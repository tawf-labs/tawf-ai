import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication middleware for API key validation
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!config.api.keyEnabled) {
    return; // Skip auth if not enabled
  }

  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn({ ip: request.ip }, 'Unauthorized access attempt: missing API key');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'API key is required',
    });
  }

  if (apiKey !== config.api.key) {
    logger.warn({ ip: request.ip }, 'Unauthorized access attempt: invalid API key');
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Invalid API key',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no API key provided
 */
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!config.api.keyEnabled) {
    return;
  }

  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey === config.api.key) {
    (request as any).isAuthenticated = true;
  }
}
