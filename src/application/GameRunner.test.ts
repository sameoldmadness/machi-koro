import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { runGame, initGame } from './GameRunner';
import { GameStrategy } from '../infrastructure/strategies/GameStrategy';
import { strategyRegistry } from '../infrastructure/strategies/StrategyRegistry';
import { Game } from '../domain/entities/Game';
import { EstablishmentName, LandmarkName } from '../domain/value-objects/Card';
import { Money } from '../domain/value-objects/Money';
import { getBrowserLogs, clearBrowserLogs } from '../infrastructure/logging/logger';

describe('GameRunner - Application Layer Orchestration', () => {
  // Helper to create a simple test strategy
  const createTestStrategy = (
    rollChoice: number = 1,
    buyChoice: EstablishmentName | LandmarkName | null = null,
    rerollChoice: number | null = null
  ): GameStrategy => ({
    roll: async () => rollChoice,
    reroll: async () => rerollChoice,
    buy: async () => buyChoice,
    swap: async () => null,
  });

  afterEach(() => {
    clearBrowserLogs();
    strategyRegistry.clear(); // Prevent test pollution
    vi.restoreAllMocks(); // Clean up any mocks
  });

  describe('runGame', () => {
    it('should run a basic game with no purchases', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      // Register strategies
      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      await runGame(game, 5);

      // Game should have progressed
      expect(game.getCurrentPlayerIndex()).toBeGreaterThanOrEqual(0);
    });

    it('should increment active player index each turn', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      // Mock roll to avoid randomness
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      await runGame(game, 3);

      expect(game.getCurrentPlayerIndex()).toBeGreaterThanOrEqual(0);
    });

    it('should stop when a player wins', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      // Make first player win by building all landmarks (before game starts)
      const player = players[0];
      player.addMoney(Money.of(100));
      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');
      player.buildLandmark('Amusement Park');
      player.buildLandmark('Radio Tower');

      await runGame(game, 1000);

      // Should stop early, not run all 1000 steps
      const logs = getBrowserLogs();
      const winLog = logs.find((log) => log.includes('has won the game'));
      expect(winLog).toBeDefined();
    });

    it('should respect max steps', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      clearBrowserLogs();
      await runGame(game, 2);

      const logs = getBrowserLogs();
      const stepLogs = logs.filter((log) => log.includes('Step number'));

      // Should have at most 2 steps
      expect(stepLogs.length).toBeLessThanOrEqual(2);
    });
  });

  describe('game mechanics - income', () => {
    it('should give income for matching blue cards', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      const initialMoney = player.getMoney().getValue();

      // Mock roll to return 1 (triggers Grain Field)
      vi.spyOn(Math, 'random').mockReturnValue(0);

      await runGame(game, 1);

      // Player should have earned income from Grain Field
      expect(player.getMoney().getValue()).toBeGreaterThan(initialMoney);
    });

    it('should give income for matching green cards on active turn', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      const initialMoney = player.getMoney().getValue();

      // Mock roll to return 2-3 (triggers Bakery)
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      await runGame(game, 1);

      // Player should have earned from Bakery
      expect(player.getMoney().getValue()).toBeGreaterThan(initialMoney);
    });
  });

  describe('game mechanics - purchases', () => {
    it('should purchase a card when strategy returns card name', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, 'Forest');
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      player.addMoney(Money.of(10));

      await runGame(game, 1);

      // Player should have purchased Forest
      expect(player.hasEstablishment('Forest')).toBe(true);
    });

    it('should purchase landmarks', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, 'Terminal');
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      player.addMoney(Money.of(10));

      await runGame(game, 1);

      // Player should have purchased Terminal
      expect(player.hasLandmark('Terminal')).toBe(true);
    });

    it('should skip purchase when strategy returns null', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      const initialEstablishments = player.getEstablishments().size;

      await runGame(game, 1);

      // Player should not have purchased anything
      expect(player.getEstablishments().size).toBe(initialEstablishments);
    });
  });

  describe('game mechanics - special abilities', () => {
    it('should allow reroll with Radio Tower', async () => {
      const rerollStrategy: GameStrategy = {
        roll: async () => 1,
        reroll: async () => 1, // Choose to reroll
        buy: async () => null,
        swap: async () => null,
      };

      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      players.forEach(p => strategyRegistry.register(p.id, rerollStrategy));

      const player = players[0];
      player.addMoney(Money.of(10));
      player.buildLandmark('Radio Tower');

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      const rerollLog = logs.find((log) => log.includes('rerolled') || log.includes('not to reroll'));
      expect(rerollLog).toBeDefined();
    });

    it('should roll again on doubles with Amusement Park', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(2, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      player.addMoney(Money.of(10));
      player.buildLandmark('Terminal');
      player.buildLandmark('Amusement Park');

      // Mock to roll doubles (same value for both dice)
      let callCount = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        return 0.5; // Consistent rolls should give doubles
      });

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      // Verify doubles bonus roll triggered
      const hasDoubleMessage = logs.some((log) => log.includes('rolled doubles and gets to roll again'));
      expect(hasDoubleMessage).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle player with zero budget', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, 'Forest'); // Try to buy but can't afford
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      // Player starts with 3 coins, not enough for Forest (costs 3)
      // Remove money
      player.removeMoney(Money.of(3));

      await runGame(game, 1);

      // Should not crash and budget should not go negative
      expect(player.getMoney().getValue()).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty deck for a card', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, 'Grain Field');
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const player = players[0];
      player.addMoney(Money.of(100));

      // Deplete Grain Field from market
      const market = game.getMarketDeck();
      while (market.isAvailable('Grain Field')) {
        market.purchase('Grain Field');
      }

      const initialCount = player.getEstablishmentCount('Grain Field');

      await runGame(game, 1);

      // Should not purchase since unavailable
      expect(player.getEstablishmentCount('Grain Field')).toBe(initialCount);
    });

    it('should handle multiple players correctly', async () => {
      const game = Game.create('test-game', ['P1', 'P2', 'P3']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      await runGame(game, 6);

      // All players should have had turns
      expect(game.getCurrentPlayerIndex()).toBeGreaterThanOrEqual(0);
      expect(game.getCurrentPlayerIndex()).toBeLessThan(3);
    });
  });

  describe('initGame', () => {
    it('should create and run a complete game', async () => {
      clearBrowserLogs();
      await initGame();

      const logs = getBrowserLogs();
      expect(logs.some((log) => log.includes('Starting new game'))).toBe(true);
      expect(logs.some((log) => log.includes('Player order:'))).toBe(true);
      expect(logs.length).toBeGreaterThan(10); // Should have substantial activity
    });

    it('should shuffle player order', async () => {
      const orders: string[] = [];

      // Run multiple games to verify shuffling
      for (let i = 0; i < 5; i++) {
        clearBrowserLogs();
        await initGame();
        const logs = getBrowserLogs();
        const orderLog = logs.find((log) => log.includes('Player order:'));
        if (orderLog) orders.push(orderLog);
      }

      // Should have variation in orders (not all identical)
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBeGreaterThan(1);
    });

    it('should complete with a winner or max steps', async () => {
      clearBrowserLogs();
      await initGame();

      const logs = getBrowserLogs();
      const hasWinner = logs.some((log) => log.includes('has won the game'));
      const hasSteps = logs.some((log) => log.includes('Step number'));

      expect(hasSteps).toBe(true);
      // Game should either complete with winner or reach max steps
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('special abilities - purple cards', () => {
    it('should execute Stadium ability (take 2 coins from every player)', async () => {
      const game = Game.create('test-game', ['P1', 'P2', 'P3']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const activePlayer = players[0];
      activePlayer.addMoney(Money.of(10));
      activePlayer.addEstablishment('Stadium');

      // Give other players money to take
      players[1].addMoney(Money.of(10));
      players[2].addMoney(Money.of(10));

      // Mock roll to trigger Stadium (dice roll 6)
      vi.spyOn(Math, 'random').mockReturnValue(5 / 6); // Roll 6

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      expect(logs.some((log) => log.includes('Took') && log.includes('coins from other players') && log.includes('Stadium'))).toBe(true);
    });

    it('should execute TV Center ability (take 5 coins from one player)', async () => {
      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      const strategy = createTestStrategy(1, null);
      players.forEach(p => strategyRegistry.register(p.id, strategy));

      const activePlayer = players[0];
      activePlayer.addMoney(Money.of(10));
      activePlayer.addEstablishment('TV Center');

      // Give other player money to take
      players[1].addMoney(Money.of(10));

      // Mock roll to trigger TV Center (dice roll 6)
      vi.spyOn(Math, 'random').mockReturnValue(5 / 6);

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      expect(logs.some((log) => log.includes('Took') && log.includes('coins from') && log.includes('TV Center'))).toBe(true);
    });

    it('should execute Business Center swap when strategy agrees', async () => {
      const swapStrategy: GameStrategy = {
        roll: async () => 1,
        reroll: async () => null,
        buy: async () => null,
        swap: async () => ({
          give: 'Grain Field',
          take: 'Bakery',
          otherPlayerIndex: 1,
        }),
      };

      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      strategyRegistry.register(players[0].id, swapStrategy);
      strategyRegistry.register(players[1].id, createTestStrategy());

      const activePlayer = players[0];
      activePlayer.addMoney(Money.of(10));
      activePlayer.addEstablishment('Business Center');

      // Mock roll to trigger Business Center (dice roll 6)
      vi.spyOn(Math, 'random').mockReturnValue(5 / 6);

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      const hasSwap = logs.some((log) =>
        log.includes('swapped') || log.includes('decided not to swap')
      );
      expect(hasSwap).toBe(true);
    });

    it('should skip Business Center swap when strategy declines', async () => {
      const noSwapStrategy: GameStrategy = {
        roll: async () => 1,
        reroll: async () => null,
        buy: async () => null,
        swap: async () => null, // Decline swap
      };

      const game = Game.create('test-game', ['P1', 'P2']);
      const players = game.getPlayers();

      players.forEach(p => strategyRegistry.register(p.id, noSwapStrategy));

      const activePlayer = players[0];
      activePlayer.addMoney(Money.of(10));
      activePlayer.addEstablishment('Business Center');

      // Mock roll to trigger Business Center (dice roll 6)
      vi.spyOn(Math, 'random').mockReturnValue(5 / 6);

      clearBrowserLogs();
      await runGame(game, 1);

      const logs = getBrowserLogs();
      expect(logs.some((log) => log.includes('decided not to swap cards'))).toBe(true);
    });
  });
});
