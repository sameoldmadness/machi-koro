/**
 * End-to-End Tests for GET /server endpoint
 *
 * These tests verify the complete server behavior including:
 * - HTTP response structure
 * - Game execution
 * - Logging functionality
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './infrastructure/api/server';

// Mock the openai module to avoid API calls during tests
vi.mock('./infrastructure/ai/openai', () => ({
  buy: vi.fn(async () => null),
}));

describe('GET /server - End-to-End Tests', () => {
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
      expect(response.body.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
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
      expect(logs).toMatch(/Player order: [A-C] → [A-C] → [A-C]/);
    });

    it('should contain game step information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toContain('Step number');
    });

    it('should contain dice roll information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toMatch(/Player rolled \d+/);
    });

    it('should contain player budget information', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      expect(logs).toMatch(/Player has \d+ coins/);
    });

    it('should contain game completion or win message', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log.join('\n');
      // Either game completed all steps or someone won
      const hasWinner = logs.includes('has won the game');
      const hasSteps = logs.includes('Step number');

      expect(hasWinner || hasSteps).toBe(true);
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

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app).get('/server');

      expect(response1.body.time).not.toBe(response2.body.time);
    });

    it('should execute a complete game each time', async () => {
      const response = await request(app).get('/server');

      const logs = response.body.log;
      expect(logs.length).toBeGreaterThan(10); // Should have substantial log output
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time (< 10 seconds)', async () => {
      const startTime = Date.now();

      await request(app).get('/server');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000);
    }, 15000); // Set test timeout to 15 seconds

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        request(app).get('/server'),
        request(app).get('/server'),
        request(app).get('/server'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    }, 30000); // Set test timeout to 30 seconds for concurrent requests
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
      const hasStarting = logs.some((log: string) => log.includes('Starting'));
      const hasCompleted = logs.some((log: string) => log.includes('completed'));
      const hasGameEvents = logs.some((log: string) => log.includes('Step number'));

      expect(hasStarting).toBe(true);
      expect(hasCompleted).toBe(true);
      expect(hasGameEvents).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should return valid JSON', async () => {
      const response = await request(app).get('/server');

      expect(() => JSON.stringify(response.body)).not.toThrow();
    });

    it('should have serializable log entries', async () => {
      const response = await request(app).get('/server');

      response.body.log.forEach((entry: any) => {
        expect(typeof entry).toBe('string');
      });
    });

    it('should maintain response body structure', async () => {
      const response = await request(app).get('/server');

      const keys = Object.keys(response.body).sort();
      expect(keys).toEqual(['log', 'status', 'time']);
    });
  });
});
