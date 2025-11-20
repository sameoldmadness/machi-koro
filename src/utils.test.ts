import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clone,
  createPlayer,
  createGame,
  canRollTwoDice,
  getCost,
  canBuy,
  roll,
  rollOne,
  buy,
  getPlayersToProcess,
  playerHasWon,
  shuffle,
  logAdd,
  logFlush,
  printtt,
} from './utils';
import { defaultStrategy } from './domain/strategies/Strategy';
import { Player, State, cards } from './game';

describe('utils.ts', () => {
  describe('clone', () => {
    it('should deep clone an object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = clone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = clone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });
  });

  describe('createPlayer', () => {
    it('should create a player with initial state', () => {
      const player = createPlayer('TestPlayer', defaultStrategy);

      expect(player.name).toBe('TestPlayer');
      expect(player.budget).toBe(3);
      expect(player.deck).toEqual({ 'Bakery': 1, 'Grain Field': 1 });
      expect(player.amusementDeck).toEqual({
        Terminal: false,
        'Shopping Center': false,
        'Amusement Park': false,
        'Radio Tower': false,
      });
      expect(player.strategy).toBe(defaultStrategy);
    });

    it('should create independent player instances', () => {
      const player1 = createPlayer('Player1', defaultStrategy);
      const player2 = createPlayer('Player2', defaultStrategy);

      player1.budget = 10;
      expect(player2.budget).toBe(3);
    });
  });

  describe('createGame', () => {
    it('should create a game with initial state', () => {
      const player1 = createPlayer('Player1', defaultStrategy);
      const player2 = createPlayer('Player2', defaultStrategy);
      const game = createGame([player1, player2]);

      expect(game.players).toEqual([player1, player2]);
      expect(game.activePlayerIndex).toBe(-1);
      expect(game.deck['Bakery']).toBe(6);
      expect(game.deck['Grain Field']).toBe(6);
    });
  });

  describe('canRollTwoDice', () => {
    it('should return true if player has Terminal', () => {
      const player = createPlayer('Test', defaultStrategy);
      player.amusementDeck.Terminal = true;

      expect(canRollTwoDice(player)).toBe(true);
    });

    it('should return false if player does not have Terminal', () => {
      const player = createPlayer('Test', defaultStrategy);

      expect(canRollTwoDice(player)).toBe(false);
    });
  });

  describe('getCost', () => {
    it('should return the cost of a card', () => {
      expect(getCost('Bakery')).toBe(1);
      expect(getCost('Cafe')).toBe(2);
      expect(getCost('Shop')).toBe(2);
      expect(getCost('Forest')).toBe(3);
      expect(getCost('Stadium')).toBe(6);
    });
  });

  describe('canBuy', () => {
    let player: Player;
    let game: State;

    beforeEach(() => {
      player = createPlayer('Test', defaultStrategy);
      game = createGame([player]);
    });

    it('should return true if player can afford and card is available', () => {
      player.budget = 5;
      expect(canBuy('Forest', player, game)).toBe(true);
    });

    it('should return false if player cannot afford card', () => {
      player.budget = 1;
      expect(canBuy('Forest', player, game)).toBe(false);
    });

    it('should return false if card is not available in deck', () => {
      player.budget = 10;
      game.deck['Forest'] = 0;
      expect(canBuy('Forest', player, game)).toBe(false);
    });

    it('should return false if trying to buy singular card already owned', () => {
      player.budget = 10;
      player.deck['Stadium'] = 1;
      expect(canBuy('Stadium', player, game)).toBe(false);
    });

    it('should return true for non-singular cards even if already owned', () => {
      player.budget = 5;
      player.deck['Forest'] = 1;
      expect(canBuy('Forest', player, game)).toBe(true);
    });
  });

  describe('rollOne', () => {
    it('should return a number between 1 and 6', () => {
      const results = new Set<number>();

      // Run multiple times to get different results
      for (let i = 0; i < 1000; i++) {
        const result = rollOne();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        results.add(result);
      }

      // Should have rolled different values
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('roll', () => {
    it('should roll one die', () => {
      const [total, rolls] = roll(1);

      expect(rolls).toHaveLength(1);
      expect(total).toBe(rolls[0]);
      expect(total).toBeGreaterThanOrEqual(1);
      expect(total).toBeLessThanOrEqual(6);
    });

    it('should roll two dice', () => {
      const [total, rolls] = roll(2);

      expect(rolls).toHaveLength(2);
      expect(total).toBe(rolls[0] + rolls[1]);
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(12);
    });

    it('should return consistent sum', () => {
      const [total, rolls] = roll(2);
      expect(total).toBe(rolls.reduce((a, b) => a + b, 0));
    });
  });

  describe('buy', () => {
    let player: Player;
    let game: State;

    beforeEach(() => {
      player = createPlayer('Test', defaultStrategy);
      game = createGame([player]);
      player.budget = 10;
    });

    it('should buy a regular card and update state', () => {
      const initialDeckCount = game.deck['Forest'];
      buy('Forest', player, game);

      expect(player.deck['Forest']).toBe(1);
      expect(player.budget).toBe(7); // 10 - 3
      expect(game.deck['Forest']).toBe(initialDeckCount - 1);
    });

    it('should increment card count if already owned', () => {
      player.deck['Forest'] = 2;
      buy('Forest', player, game);

      expect(player.deck['Forest']).toBe(3);
    });

    it('should buy an amusement card', () => {
      buy('Terminal', player, game);

      expect(player.amusementDeck.Terminal).toBe(true);
      expect(player.budget).toBe(6); // 10 - 4
    });

    it('should not affect game deck when buying amusement cards', () => {
      const initialDeck = clone(game.deck);
      buy('Shopping Center', player, game);

      expect(game.deck).toEqual(initialDeck);
    });
  });

  describe('getPlayersToProcess', () => {
    it('should reorder players starting from active player', () => {
      const player1 = createPlayer('P1', defaultStrategy);
      const player2 = createPlayer('P2', defaultStrategy);
      const player3 = createPlayer('P3', defaultStrategy);
      const players = [player1, player2, player3];

      const reordered = getPlayersToProcess(1, players);

      expect(reordered).toEqual([player2, player3, player1]);
    });

    it('should handle active player at start', () => {
      const player1 = createPlayer('P1', defaultStrategy);
      const player2 = createPlayer('P2', defaultStrategy);
      const players = [player1, player2];

      const reordered = getPlayersToProcess(0, players);

      expect(reordered).toEqual([player1, player2]);
    });

    it('should handle active player at end', () => {
      const player1 = createPlayer('P1', defaultStrategy);
      const player2 = createPlayer('P2', defaultStrategy);
      const player3 = createPlayer('P3', defaultStrategy);
      const players = [player1, player2, player3];

      const reordered = getPlayersToProcess(2, players);

      expect(reordered).toEqual([player3, player1, player2]);
    });
  });

  describe('playerHasWon', () => {
    it('should return true if all amusement cards are owned', () => {
      const player = createPlayer('Test', defaultStrategy);
      player.amusementDeck.Terminal = true;
      player.amusementDeck['Shopping Center'] = true;
      player.amusementDeck['Amusement Park'] = true;
      player.amusementDeck['Radio Tower'] = true;

      expect(playerHasWon(player)).toBe(true);
    });

    it('should return false if any amusement card is missing', () => {
      const player = createPlayer('Test', defaultStrategy);
      player.amusementDeck.Terminal = true;
      player.amusementDeck['Shopping Center'] = true;
      player.amusementDeck['Amusement Park'] = true;

      expect(playerHasWon(player)).toBe(false);
    });

    it('should return false for new player', () => {
      const player = createPlayer('Test', defaultStrategy);

      expect(playerHasWon(player)).toBe(false);
    });
  });

  describe('shuffle', () => {
    it('should shuffle an array', () => {
      const player1 = createPlayer('P1', defaultStrategy);
      const player2 = createPlayer('P2', defaultStrategy);
      const player3 = createPlayer('P3', defaultStrategy);
      const players = [player1, player2, player3];

      // Mock Math.random to produce predictable shuffle
      const originalRandom = Math.random;
      Math.random = () => 0.5;

      const shuffled = shuffle([...players]);

      Math.random = originalRandom;

      expect(shuffled).toHaveLength(3);
      expect(shuffled).toContain(player1);
      expect(shuffled).toContain(player2);
      expect(shuffled).toContain(player3);
    });

    it('should return array with same elements', () => {
      const players = [
        createPlayer('P1', defaultStrategy),
        createPlayer('P2', defaultStrategy),
        createPlayer('P3', defaultStrategy),
      ];

      const shuffled = shuffle([...players]);

      // Check that all players are present (same length and same names)
      expect(shuffled).toHaveLength(players.length);
      const shuffledNames = shuffled.map(p => p.name).sort();
      const originalNames = players.map(p => p.name).sort();
      expect(shuffledNames).toEqual(originalNames);
    });
  });

  describe('logging functions', () => {
    beforeEach(() => {
      logFlush(); // Clear any previous logs
    });

    it('should add messages to log', () => {
      logAdd('test message 1');
      logAdd('test message 2');

      const logs = logFlush();

      expect(logs).toEqual(['test message 1', 'test message 2']);
    });

    it('should clear log after flush', () => {
      logAdd('test');
      logFlush();

      const logs = logFlush();

      expect(logs).toEqual([]);
    });

    it('printtt should add to log', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printtt('test message');

      const logs = logFlush();
      expect(logs).toContain('test message');

      consoleSpy.mockRestore();
    });
  });
});
