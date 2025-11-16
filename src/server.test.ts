import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from './server';
import { createPlayer, createGame } from './utils';
import { defaultStrategy } from './strategy';

// Mock the openai module to avoid API calls
vi.mock('./openai', () => ({
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

  describe('POST /server', () => {
    it('should return 400 if action is missing', async () => {
      const response = await request(app)
        .post('/server')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if action is not a string', async () => {
      const response = await request(app)
        .post('/server')
        .send({ action: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('action');
    });

    it('should handle valid action', async () => {
      const response = await request(app)
        .post('/server')
        .send({ action: 'test', payload: { data: 'test' } });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('handledBy', 'server');
      expect(response.body).toHaveProperty('action', 'test');
      expect(response.body).toHaveProperty('payload');
    });

    it('should handle action without payload', async () => {
      const response = await request(app)
        .post('/server')
        .send({ action: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('test');
    });
  });

  describe('GET /agent/:id', () => {
    it('should return agent status', async () => {
      const response = await request(app).get('/agent/test-agent-123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('agentId', 'test-agent-123');
      expect(response.body).toHaveProperty('status', 'ready');
    });

    it('should handle different agent ids', async () => {
      const response1 = await request(app).get('/agent/agent1');
      const response2 = await request(app).get('/agent/agent2');

      expect(response1.body.agentId).toBe('agent1');
      expect(response2.body.agentId).toBe('agent2');
    });
  });

  describe('POST /agent/:id', () => {
    it('should return 400 if action is missing', async () => {
      const response = await request(app)
        .post('/agent/test-agent')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle roll action', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'roll',
          payload: { game },
        });

      expect(response.status).toBe(200);
      expect(response.body.handledBy).toBe('agent');
      expect(response.body.agentId).toBe('test-agent');
      expect(response.body.action).toBe('roll');
      expect(response.body.response).toBeDefined();
      expect([1, 2]).toContain(response.body.response);
    });

    it('should handle reroll action', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'reroll',
          payload: { previousRoll: 5, game },
        });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('reroll');
      expect(response.body.response).toBeDefined();
    });

    it('should handle buy action', async () => {
      const player = createPlayer('Test', defaultStrategy);
      player.budget = 100;
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'buy',
          payload: { game },
        });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('buy');
      expect(response.body.response).toBeDefined();
    });

    it('should handle swap action', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'swap',
          payload: { game },
        });

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('swap');
      expect(response.body.response).toBeDefined();
    });

    it('should return 400 for unknown action', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'unknown',
          payload: { game },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unknown action');
    });

    it('should include timestamp in response', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response = await request(app)
        .post('/agent/test-agent')
        .send({
          action: 'roll',
          payload: { game },
        });

      expect(response.body.processedAt).toBeTruthy();
      const date = new Date(response.body.processedAt);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should handle different agent IDs', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);

      const response1 = await request(app)
        .post('/agent/agent-1')
        .send({ action: 'roll', payload: { game } });

      const response2 = await request(app)
        .post('/agent/agent-2')
        .send({ action: 'roll', payload: { game } });

      expect(response1.body.agentId).toBe('agent-1');
      expect(response2.body.agentId).toBe('agent-2');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/server')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });

  describe('integration tests', () => {
    it('should handle complete agent workflow', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);
      player.budget = 10;

      // Step 1: Roll
      const rollResponse = await request(app)
        .post('/agent/workflow-test')
        .send({ action: 'roll', payload: { game } });

      expect(rollResponse.status).toBe(200);
      expect(rollResponse.body.response).toBeDefined();

      // Step 2: Buy
      const buyResponse = await request(app)
        .post('/agent/workflow-test')
        .send({ action: 'buy', payload: { game } });

      expect(buyResponse.status).toBe(200);
      expect(buyResponse.body.response).toBeDefined();
    });

    it('should maintain separate state for different agents', async () => {
      const player1 = createPlayer('Player1', defaultStrategy);
      const player2 = createPlayer('Player2', defaultStrategy);
      const game1 = createGame([player1]);
      const game2 = createGame([player2]);

      const response1 = await request(app)
        .post('/agent/agent-1')
        .send({ action: 'roll', payload: { game: game1 } });

      const response2 = await request(app)
        .post('/agent/agent-2')
        .send({ action: 'roll', payload: { game: game2 } });

      expect(response1.body.agentId).toBe('agent-1');
      expect(response2.body.agentId).toBe('agent-2');
    });
  });
});
