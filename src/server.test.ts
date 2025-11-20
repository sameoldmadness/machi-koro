import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './infrastructure/api/server';

// Mock the openai module to avoid API calls
vi.mock('./infrastructure/ai/openai', () => ({
  buy: vi.fn(async () => null),
}));

describe('server.ts - Express API', () => {
  describe('GET /server', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/server');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('time');
      expect(response.body).toHaveProperty('log');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/server');

      expect(response.body.time).toBeTruthy();
      const date = new Date(response.body.time);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should return log array', async () => {
      const response = await request(app).get('/server');

      expect(Array.isArray(response.body.log)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    it('should return 404 for POST /server', async () => {
      const response = await request(app)
        .post('/server')
        .send({});

      expect(response.status).toBe(404);
    });

    it('should return 404 for agent routes', async () => {
      const response = await request(app).get('/agent/test-agent');

      expect(response.status).toBe(404);
    });
  });
});
