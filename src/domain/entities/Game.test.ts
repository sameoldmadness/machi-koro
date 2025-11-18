import { describe, it, expect } from 'vitest';
import { Game } from './Game';
import { Player } from './Player';
import { MarketDeck } from './MarketDeck';
import { Money } from '../value-objects/Money';
import { DiceRoll } from '../value-objects/DiceRoll';

describe('Game Aggregate Root', () => {
  describe('creation', () => {
    it('should create game with 2 players', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(game.id).toBe('game-1');
      expect(game.getPlayerCount()).toBe(2);
      expect(game.getStatus()).toBe('waiting');
    });

    it('should create game with 4 players', () => {
      const game = Game.create('game-1', ['Alice', 'Bob', 'Charlie', 'David']);

      expect(game.getPlayerCount()).toBe(4);
    });

    it('should throw error with less than 2 players', () => {
      expect(() => Game.create('game-1', ['Alice'])).toThrow('Game requires 2-4 players');
    });

    it('should throw error with more than 4 players', () => {
      expect(() =>
        Game.create('game-1', ['Alice', 'Bob', 'Charlie', 'David', 'Eve'])
      ).toThrow('Game requires 2-4 players');
    });

    it('should create players with correct starting state', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const players = game.getPlayers();
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[0].getMoney().getValue()).toBe(3);
      expect(players[1].getMoney().getValue()).toBe(3);
    });

    it('should create market deck', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const market = game.getMarketDeck();
      expect(market).toBeDefined();
      expect(market.isAvailable('Grain Field')).toBe(true);
    });

    it('should create with custom state', () => {
      const players = [
        Player.create('p1', 'Alice'),
        Player.create('p2', 'Bob'),
      ];
      const market = MarketDeck.create('market-1');

      const game = Game.createWithState('game-1', players, market, 1, 'in_progress');

      expect(game.getCurrentPlayerIndex()).toBe(1);
      expect(game.getStatus()).toBe('in_progress');
    });
  });

  describe('game flow', () => {
    it('should start game', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      game.start();

      expect(game.isStarted()).toBe(true);
      expect(game.getStatus()).toBe('in_progress');
    });

    it('should throw error when starting already started game', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      expect(() => game.start()).toThrow('Game has already started');
    });

    it('should end turn and move to next player', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const firstPlayer = game.getCurrentPlayer();
      game.endTurn();
      const secondPlayer = game.getCurrentPlayer();

      expect(firstPlayer.name).toBe('Alice');
      expect(secondPlayer.name).toBe('Bob');
    });

    it('should cycle back to first player after last player', () => {
      const game = Game.create('game-1', ['Alice', 'Bob', 'Charlie']);
      game.start();

      game.endTurn(); // Bob's turn
      game.endTurn(); // Charlie's turn
      game.endTurn(); // Back to Alice's turn

      expect(game.getCurrentPlayer().name).toBe('Alice');
    });

    it('should throw error when ending turn before game starts', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(() => game.endTurn()).toThrow('Game is not in progress');
    });

    it('should record dice roll', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const roll = DiceRoll.of([5]);
      game.recordDiceRoll(roll);

      expect(game.getLastDiceRoll()).toBe(roll);
      expect(game.getLastDiceRoll()?.total).toBe(5);
    });

    it('should return null for last dice roll initially', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(game.getLastDiceRoll()).toBeNull();
    });
  });

  describe('player access', () => {
    it('should get current player', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const player = game.getCurrentPlayer();

      expect(player.name).toBe('Alice');
      expect(player.id).toBe('player-1');
    });

    it('should throw error getting current player before game starts', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(() => game.getCurrentPlayer()).toThrow('Game has not started yet');
    });

    it('should get player by ID', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const player = game.getPlayerById('player-2');

      expect(player).toBeDefined();
      expect(player?.name).toBe('Bob');
    });

    it('should return undefined for non-existent player ID', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const player = game.getPlayerById('player-999');

      expect(player).toBeUndefined();
    });

    it('should get player by name', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const player = game.getPlayerByName('Alice');

      expect(player).toBeDefined();
      expect(player?.id).toBe('player-1');
    });

    it('should return undefined for non-existent player name', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const player = game.getPlayerByName('Charlie');

      expect(player).toBeUndefined();
    });

    it('should get all players', () => {
      const game = Game.create('game-1', ['Alice', 'Bob', 'Charlie']);

      const players = game.getPlayers();

      expect(players.length).toBe(3);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[2].name).toBe('Charlie');
    });

    it('should return defensive copy of players', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const players = game.getPlayers();
      players.push(Player.create('p99', 'Hacker'));

      // Original should be unchanged
      expect(game.getPlayerCount()).toBe(2);
    });

    it('should get other players (not current)', () => {
      const game = Game.create('game-1', ['Alice', 'Bob', 'Charlie']);
      game.start();

      const others = game.getOtherPlayers();

      expect(others.length).toBe(2);
      expect(others.some((p) => p.name === 'Alice')).toBe(false);
      expect(others.some((p) => p.name === 'Bob')).toBe(true);
      expect(others.some((p) => p.name === 'Charlie')).toBe(true);
    });

    it('should get all players as others before game starts', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const others = game.getOtherPlayers();

      expect(others.length).toBe(2);
    });
  });

  describe('market access', () => {
    it('should get market deck', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      const market = game.getMarketDeck();

      expect(market).toBeDefined();
      expect(market.getAvailableQuantity('Grain Field')).toBe(6);
    });

    it('should share same market across all players', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const market = game.getMarketDeck();
      market.purchase('Bakery');

      expect(market.getAvailableQuantity('Bakery')).toBe(5);
    });
  });

  describe('winning conditions', () => {
    it('should not have winner initially', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(game.hasWinner()).toBe(false);
      expect(game.getWinner()).toBeNull();
    });

    it('should detect winner when player has all landmarks', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const alice = game.getCurrentPlayer();
      alice.buildLandmark('Terminal');
      alice.buildLandmark('Shopping Center');
      alice.buildLandmark('Amusement Park');
      alice.buildLandmark('Radio Tower');

      game.endTurn();

      expect(game.isFinished()).toBe(true);
      expect(game.hasWinner()).toBe(true);
      expect(game.getWinner()?.name).toBe('Alice');
    });

    it('should not end game if player has not won', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const alice = game.getCurrentPlayer();
      alice.buildLandmark('Terminal');

      game.endTurn();

      expect(game.isFinished()).toBe(false);
      expect(game.hasWinner()).toBe(false);
    });

    it('should finish game when winner detected', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const alice = game.getCurrentPlayer();
      alice.buildLandmark('Terminal');
      alice.buildLandmark('Shopping Center');
      alice.buildLandmark('Amusement Park');
      alice.buildLandmark('Radio Tower');

      game.endTurn();

      expect(game.getStatus()).toBe('finished');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();
      game.recordDiceRoll(DiceRoll.of([4]));

      const json = game.toJSON();

      expect(json.id).toBe('game-1');
      expect(json.players.length).toBe(2);
      expect(json.currentPlayerIndex).toBe(0);
      expect(json.status).toBe('in_progress');
      expect(json.lastDiceRoll).toEqual({ total: 4, dice: [4] });
    });

    it('should serialize winner when game finished', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const alice = game.getCurrentPlayer();
      alice.buildLandmark('Terminal');
      alice.buildLandmark('Shopping Center');
      alice.buildLandmark('Amusement Park');
      alice.buildLandmark('Radio Tower');
      game.endTurn();

      const json = game.toJSON();

      expect(json.winner).toBe('player-1');
      expect(json.status).toBe('finished');
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'game-1',
        players: [
          {
            id: 'player-1',
            name: 'Alice',
            money: 5,
            establishments: { 'Grain Field': 1 },
            landmarks: ['Terminal'],
          },
          {
            id: 'player-2',
            name: 'Bob',
            money: 3,
            establishments: { Bakery: 1 },
            landmarks: [],
          },
        ],
        marketDeck: {
          id: 'market-1',
          quantities: { 'Grain Field': 5, Bakery: 6 },
        },
        currentPlayerIndex: 1,
        status: 'in_progress' as const,
        winner: null,
        lastDiceRoll: { total: 3, dice: [3] },
      };

      const game = Game.fromJSON(json);

      expect(game.id).toBe('game-1');
      expect(game.getPlayerCount()).toBe(2);
      expect(game.getCurrentPlayerIndex()).toBe(1);
      expect(game.getStatus()).toBe('in_progress');
      expect(game.getLastDiceRoll()?.total).toBe(3);
    });

    it('should round-trip serialize/deserialize', () => {
      const original = Game.create('game-1', ['Alice', 'Bob']);
      original.start();
      original.getCurrentPlayer().addMoney(Money.of(5));
      original.recordDiceRoll(DiceRoll.of([2, 3]));

      const json = original.toJSON();
      const restored = Game.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.getPlayerCount()).toBe(original.getPlayerCount());
      expect(restored.getStatus()).toBe(original.getStatus());
      expect(restored.getCurrentPlayerIndex()).toBe(original.getCurrentPlayerIndex());
      expect(restored.getLastDiceRoll()?.total).toBe(original.getLastDiceRoll()?.total);
    });
  });

  describe('aggregate invariants', () => {
    it('should enforce minimum 2 players', () => {
      const players = [Player.create('p1', 'Alice')];
      const market = MarketDeck.create('market-1');

      expect(() => Game.createWithState('game-1', players, market, 0, 'waiting')).toThrow(
        'Game requires 2-4 players'
      );
    });

    it('should enforce maximum 4 players', () => {
      const players = [
        Player.create('p1', 'Alice'),
        Player.create('p2', 'Bob'),
        Player.create('p3', 'Charlie'),
        Player.create('p4', 'David'),
        Player.create('p5', 'Eve'),
      ];
      const market = MarketDeck.create('market-1');

      expect(() => Game.createWithState('game-1', players, market, 0, 'waiting')).toThrow(
        'Game requires 2-4 players'
      );
    });

    it('should maintain consistency when modifying player state through aggregate', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      const alice = game.getCurrentPlayer();
      alice.addMoney(Money.of(10));

      // State should be reflected in game
      expect(game.getCurrentPlayer().getMoney().getValue()).toBe(13);
    });
  });

  describe('edge cases', () => {
    it('should handle game state transitions', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);

      expect(game.getStatus()).toBe('waiting');

      game.start();
      expect(game.getStatus()).toBe('in_progress');

      game.getCurrentPlayer().buildLandmark('Terminal');
      game.getCurrentPlayer().buildLandmark('Shopping Center');
      game.getCurrentPlayer().buildLandmark('Amusement Park');
      game.getCurrentPlayer().buildLandmark('Radio Tower');
      game.endTurn();

      expect(game.getStatus()).toBe('finished');
    });

    it('should handle multiple dice rolls', () => {
      const game = Game.create('game-1', ['Alice', 'Bob']);
      game.start();

      game.recordDiceRoll(DiceRoll.of([1]));
      game.recordDiceRoll(DiceRoll.of([6]));
      game.recordDiceRoll(DiceRoll.of([3, 4]));

      expect(game.getLastDiceRoll()?.total).toBe(7);
    });
  });
});
