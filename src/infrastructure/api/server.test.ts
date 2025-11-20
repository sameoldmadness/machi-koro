/**
 * Server API Tests
 *
 * Comprehensive tests for the Express server endpoint including:
 * - HTTP response structure and status codes
 * - Game execution and completion
 * - Logging functionality and integration
 * - Error handling and edge cases
 * - Performance and concurrency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './server';

// Mock the openai module to avoid API calls during tests
vi.mock('../ai/openai', () => ({
  buy: vi.fn(async () => null),
}));

describe('Server API - /server endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Game Execution', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/server');

      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/server');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return all required response fields', async () => {
      const response = await request(app).get('/server');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('time');
      expect(response.body).toHaveProperty('log');
    });

    it('should have status "ok"', async () => {
      const response = await request(app).get('/server');

      expect(response.body.status).toBe('ok');
    });

    it('should return a valid ISO 8601 timestamp', async () => {
      const response = await request(app).get('/server');

      expect(response.body.time).toBeTruthy();
      const date = new Date(response.body.time);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should return logs as an array', async () => {
      const response = await request(app).get('/server');

      expect(Array.isArray(response.body.log)).toBe(true);
    });

    it('should return non-empty logs array', async () => {
      const response = await request(app).get('/server');

      expect(response.body.log.length).toBeGreaterThan(0);
    });
  });

  describe('Game Execution Verification', () => {
    it('should contain game start log message', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toContain('Starting new game');
    });

    it('should contain player information in logs', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toMatch(/Player order:/);
    });

    it('should contain game step information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toContain('Step number');
    });

    it('should contain dice roll information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toMatch(/rolled/i);
    });

    it('should contain player budget information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toMatch(/coins/i);
    });

    it('should contain game completion or win message', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      // Game should either complete normally or have a winner
      const hasCompletion = logs.includes('won the game') || logs.includes('Game completed');
      expect(hasCompletion).toBe(true);
    });
  });

  describe('Response Consistency', () => {
    it('should return consistent response structure across multiple requests', async () => {
      const response1 = await request(app).get('/server');
      const response2 = await request(app).get('/server');

      expect(response1.body).toHaveProperty('status');
      expect(response1.body).toHaveProperty('time');
      expect(response1.body).toHaveProperty('log');

      expect(response2.body).toHaveProperty('status');
      expect(response2.body).toHaveProperty('time');
      expect(response2.body).toHaveProperty('log');
    });

    it('should have different timestamps for different requests', async () => {
      const response1 = await request(app).get('/server');
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const response2 = await request(app).get('/server');

      expect(response1.body.time).not.toBe(response2.body.time);
    });

    it('should execute a complete game each time', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      // Verify game had multiple steps
      const stepMatches = logs.match(/Step number/g);
      expect(stepMatches?.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time (< 10 seconds)', async () => {
      const startTime = Date.now();
      await request(app).get('/server');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000);
    }, 15000); // 15 second timeout for the test itself

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        request(app).get('/server'),
        request(app).get('/server'),
        request(app).get('/server'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    }, 30000); // 30 second timeout for concurrent requests
  });

  describe('Error Handling', () => {
    it('should not accept POST requests', async () => {
      const response = await request(app).post('/server').send({});

      expect(response.status).toBe(404);
    });

    it('should not accept PUT requests', async () => {
      const response = await request(app).put('/server').send({});

      expect(response.status).toBe(404);
    });

    it('should not accept DELETE requests', async () => {
      const response = await request(app).delete('/server');

      expect(response.status).toBe(404);
    });

    it('should handle unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });

  describe('Logging Integration', () => {
    it('should include starting endpoint message in logs', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toContain('Starting game via /server endpoint');
    });

    it('should include completion message in logs', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toContain('Game completed successfully');
    });

    it('should have logs with game events', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log;
      expect(logs.length).toBeGreaterThan(10); // Should have substantial game activity
    });
  });

  describe('Response Format', () => {
    it('should return valid JSON', async () => {
      const response = await request(app).get('/server');

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });

    it('should have serializable log entries', async () => {
      const response = await request(app).get('/server');

      response.body.log.forEach((logEntry: any) => {
        expect(typeof logEntry).toBe('string');
      });
    });

    it('should maintain response body structure', async () => {
      const response = await request(app).get('/server');

      expect(response.body.status).toBe('ok');
      expect(typeof response.body.time).toBe('string');
      expect(Array.isArray(response.body.log)).toBe(true);
    });
  });
});
