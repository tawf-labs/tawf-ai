import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/index.js';

describe('API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should pass health check', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
    });
  });
});
