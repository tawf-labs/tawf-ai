import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * Global error handler
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { validation, statusCode, message } = error;

  // Log error
  logger.error({
    url: request.url,
    method: request.method,
    statusCode,
    message,
    validation,
  }, 'Request error');

  // Handle validation errors
  if (validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: validation,
    });
  }

  // Handle known HTTP errors
  const status = statusCode || 500;

  return reply.status(status).send({
    error: error.name || 'Internal Server Error',
    message: status === 500 ? 'An unexpected error occurred' : message,
  });
}
