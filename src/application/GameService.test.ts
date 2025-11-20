import { describe, it, expect } from 'vitest';
import {
  createGame,
  processIncome,
  executePurchase,
  checkWinCondition,
  nextTurn,
} from './GameService';
import { DiceRoll } from '../domain/value-objects/DiceRoll';
import { Money } from '../domain/value-objects/Money';

describe('GameService', () => {
  describe('createGame', () => {
    it('should create a game with specified players', () => {
      const game = createGame(['Alice', 'Bob', 'Charlie']);

      expect(game.getPlayers()).toHaveLength(3);
      expect(game.getPlayers()[0].name).toBe('Alice');
      expect(game.getPlayers()[1].name).toBe('Bob');
      expect(game.getPlayers()[2].name).toBe('Charlie');
      expect(game.getCurrentPlayerIndex()).toBe(0);
    });
  });

  describe('processIncome', () => {
    it('should process income for all players based on dice roll', () => {
      const game = createGame(['Alice', 'Bob']);
      const diceRoll = DiceRoll.of([1]); // Activates Wheat Field (blue card)

      const initialBudget = game.getPlayers()[0].getMoney().getValue();

      processIncome(game, diceRoll);

      // Both players should get income from their starting Wheat Fields
      expect(game.getPlayers()[0].getMoney().getValue()).toBeGreaterThan(initialBudget);
      expect(game.getPlayers()[1].getMoney().getValue()).toBeGreaterThan(initialBudget);
    });
  });

  describe('executePurchase', () => {
    it('should allow purchasing a card when player has enough money', () => {
      const game = createGame(['Alice', 'Bob']);
      game.start(); // Start the game so we can get the current player
      const player = game.getCurrentPlayer();

      // Give player enough money
      player.addMoney(Money.of(10));

      const result = executePurchase(game, 'Bakery');

      expect(result.success).toBe(true);
      expect(player.getEstablishments().has('Bakery')).toBe(true);
    });

    it('should prevent purchasing when player has insufficient funds', () => {
      const game = createGame(['Alice', 'Bob']);
      game.start(); // Start the game so we can get the current player
      const player = game.getCurrentPlayer();

      // Player starts with only 3 coins
      expect(player.getMoney().getValue()).toBe(3);

      const result = executePurchase(game, 'Stadium'); // Costs 6

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot afford');
    });
  });

  describe('checkWinCondition', () => {
    it('should return false when player has not built all landmarks', () => {
      const game = createGame(['Alice', 'Bob']);
      game.start();

      expect(checkWinCondition(game)).toBe(false);
    });

    it('should return true when player has built all landmarks', () => {
      const game = createGame(['Alice', 'Bob']);
      game.start();
      const player = game.getCurrentPlayer();

      // Build all landmarks
      player.addMoney(Money.of(100));
      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');
      player.buildLandmark('Amusement Park');
      player.buildLandmark('Radio Tower');

      expect(checkWinCondition(game)).toBe(true);
    });
  });

  describe('nextTurn', () => {
    it('should advance to the next player', () => {
      const game = createGame(['Alice', 'Bob', 'Charlie']);
      game.start(); // Must start game before ending turns

      expect(game.getCurrentPlayerIndex()).toBe(0);

      nextTurn(game);
      expect(game.getCurrentPlayerIndex()).toBe(1);

      nextTurn(game);
      expect(game.getCurrentPlayerIndex()).toBe(2);

      nextTurn(game);
      expect(game.getCurrentPlayerIndex()).toBe(0); // Wraps around
    });
  });
});
