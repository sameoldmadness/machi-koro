import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultStrategy,
  grainStrategy,
  shopStrategy,
  cogStrategy,
} from './strategy';
import { createPlayer, createGame } from './utils';
import { State } from './game';

describe('strategy.ts - AI Strategies', () => {
  let game: State;

  beforeEach(() => {
    const player = createPlayer('Test', defaultStrategy);
    game = createGame([player]);
    game.activePlayerIndex = 0; // Set to first player
  });

  describe('defaultStrategy', () => {
    describe('roll', () => {
      it('should roll 2 dice when Terminal is owned', async () => {
        const player = game.players[0];
        player.amusementDeck.Terminal = true;

        const result = await defaultStrategy.roll(game);

        expect(result).toBe(2);
      });

      it('should roll 1 die when Terminal is not owned', async () => {
        const result = await defaultStrategy.roll(game);

        expect(result).toBe(1);
      });
    });

    describe('reroll', () => {
      it('should reroll with 2 dice when Terminal is owned', async () => {
        const player = game.players[0];
        player.amusementDeck.Terminal = true;

        const result = await defaultStrategy.reroll(5, game);

        expect(result).toBe(2);
      });

      it('should reroll with 1 die when Terminal is not owned', async () => {
        const result = await defaultStrategy.reroll(5, game);

        expect(result).toBe(1);
      });
    });

    describe('buy', () => {
      it('should prioritize amusement cards in order', async () => {
        const player = game.players[0];
        player.budget = 4;

        const result = await defaultStrategy.buy(game);

        expect(result).toBe('Terminal');
      });

      it('should buy Shopping Center when affordable and Terminal owned', async () => {
        const player = game.players[0];
        player.budget = 10;
        player.amusementDeck.Terminal = true;

        const result = await defaultStrategy.buy(game);

        expect(result).toBe('Shopping Center');
      });

      it('should buy regular cards when budget is too low for amusements', async () => {
        const player = game.players[0];
        player.budget = 2;

        const result = await defaultStrategy.buy(game);

        expect(result).not.toBeNull();
        expect(result).not.toBe('Terminal');
      });

      it('should return null when cannot afford anything', async () => {
        const player = game.players[0];
        player.budget = 0;

        const result = await defaultStrategy.buy(game);

        expect(result).toBeNull();
      });

      it('should not buy singular cards if already owned', async () => {
        const player = game.players[0];
        player.budget = 20;
        player.deck['Stadium'] = 1;

        const result = await defaultStrategy.buy(game);

        expect(result).not.toBe('Stadium');
      });
    });

    describe('swap', () => {
      it('should return null (no swap)', async () => {
        const result = await defaultStrategy.swap(game);

        expect(result).toBeNull();
      });
    });
  });

  describe('grainStrategy', () => {
    describe('buy', () => {
      it('should prioritize buying Grain Field up to 4', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;

        const result = await grainStrategy.buy(game);

        expect(result).toBe('Grain Field');
      });

      it('should not buy more than 4 Grain Fields', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Grain Field'] = 4;

        const result = await grainStrategy.buy(game);

        expect(result).not.toBe('Grain Field');
      });

      it('should buy Terminal after Grain Fields', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Grain Field'] = 4;

        const result = await grainStrategy.buy(game);

        expect(result).toBe('Terminal');
      });

      it('should buy Fruit Market after Grain Fields and Terminal', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Grain Field'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await grainStrategy.buy(game);

        expect(result).toBe('Fruit Market');
      });

      it('should not buy more than 4 Fruit Markets', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Grain Field'] = 4;
        player.deck['Fruit Market'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await grainStrategy.buy(game);

        expect(result).not.toBe('Fruit Market');
      });

      it('should buy Apple Garden after Fruit Market', async () => {
        const player = createPlayer('Test', grainStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Grain Field'] = 4;
        player.deck['Fruit Market'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await grainStrategy.buy(game);

        expect(result).toBe('Apple Garden');
      });
    });
  });

  describe('shopStrategy', () => {
    describe('roll', () => {
      it('should always roll 1 die', async () => {
        const player = createPlayer('Test', shopStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.amusementDeck.Terminal = true; // Even with Terminal

        const result = await shopStrategy.roll(game);

        expect(result).toBe(1);
      });
    });

    describe('reroll', () => {
      it('should never reroll', async () => {
        const result = await shopStrategy.reroll(5, game);

        expect(result).toBeNull();
      });
    });

    describe('buy', () => {
      it('should prioritize buying Shop up to 6', async () => {
        const player = createPlayer('Test', shopStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;

        const result = await shopStrategy.buy(game);

        expect(result).toBe('Shop');
      });

      it('should not buy more than 6 Shops', async () => {
        const player = createPlayer('Test', shopStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Shop'] = 6;

        const result = await shopStrategy.buy(game);

        expect(result).not.toBe('Shop');
      });

      it('should buy Shopping Center before other amusements', async () => {
        const player = createPlayer('Test', shopStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 15;
        player.deck['Shop'] = 6;

        const result = await shopStrategy.buy(game);

        expect(result).toBe('Shopping Center');
      });

      it('should buy Terminal after Shopping Center', async () => {
        const player = createPlayer('Test', shopStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 15;
        player.deck['Shop'] = 6;
        player.amusementDeck['Shopping Center'] = true;

        const result = await shopStrategy.buy(game);

        expect(result).toBe('Terminal');
      });
    });
  });

  describe('cogStrategy', () => {
    describe('buy', () => {
      it('should prioritize buying Forest up to 4', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;

        const result = await cogStrategy.buy(game);

        expect(result).toBe('Forest');
      });

      it('should not buy more than 4 Forests', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Forest'] = 4;

        const result = await cogStrategy.buy(game);

        expect(result).not.toBe('Forest');
      });

      it('should buy Terminal after Forests', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Forest'] = 4;

        const result = await cogStrategy.buy(game);

        expect(result).toBe('Terminal');
      });

      it('should buy Furniture Factory after Terminal', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Forest'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await cogStrategy.buy(game);

        expect(result).toBe('Furniture Factory');
      });

      it('should not buy more than 4 Furniture Factories', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 10;
        player.deck['Forest'] = 4;
        player.deck['Furniture Factory'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await cogStrategy.buy(game);

        expect(result).not.toBe('Furniture Factory');
      });

      it('should buy Shopping Center after cog cards', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 15;
        player.deck['Forest'] = 4;
        player.deck['Furniture Factory'] = 4;
        player.amusementDeck.Terminal = true;

        const result = await cogStrategy.buy(game);

        expect(result).toBe('Shopping Center');
      });
    });

    describe('reroll', () => {
      it('should use default roll strategy for reroll', async () => {
        const player = createPlayer('Test', cogStrategy);
        game = createGame([player]);
        game.activePlayerIndex = 0;
        player.amusementDeck.Terminal = true;

        const result = await cogStrategy.reroll(5, game);

        expect(result).toBe(2);
      });
    });
  });

  describe('strategy integration', () => {
    it('all strategies should implement Strategy interface', async () => {
      const strategies = [defaultStrategy, grainStrategy, shopStrategy, cogStrategy];
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);
      game.activePlayerIndex = 0;

      for (const strategy of strategies) {
        expect(await strategy.roll(game)).toBeTypeOf('number');
        expect(await strategy.buy(game)).toBeDefined();
        expect(await strategy.swap(game)).toBeDefined();

        const rerollResult = await strategy.reroll(5, game);
        expect(rerollResult === null || typeof rerollResult === 'number').toBe(true);
      }
    });

    it('strategies should make valid purchase choices', async () => {
      const strategies = [
        { name: 'default', strategy: defaultStrategy },
        { name: 'grain', strategy: grainStrategy },
        { name: 'shop', strategy: shopStrategy },
        { name: 'cog', strategy: cogStrategy },
      ];

      for (const { strategy } of strategies) {
        const player = createPlayer('Test', strategy);
        const game = createGame([player]);
        game.activePlayerIndex = 0;
        player.budget = 100; // Give enough budget

        const purchase = await strategy.buy(game);

        if (purchase !== null) {
          // If not null, should be a valid card name
          const allCards = [...Object.keys(game.deck), 'Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
          expect(allCards).toContain(purchase);
        }
      }
    });

    it('strategies should respect Terminal ownership for rolling', async () => {
      const strategies = [defaultStrategy, grainStrategy, cogStrategy];

      for (const strategy of strategies) {
        const player = createPlayer('Test', strategy);
        const gameWithoutTerminal = createGame([player]);
        gameWithoutTerminal.activePlayerIndex = 0;
        const rollWithout = await strategy.roll(gameWithoutTerminal);

        player.amusementDeck.Terminal = true;
        const gameWithTerminal = createGame([player]);
        gameWithTerminal.activePlayerIndex = 0;
        gameWithTerminal.players[0] = player;
        const rollWith = await strategy.roll(gameWithTerminal);

        // Most strategies should roll more dice with Terminal
        // Except shopStrategy which always rolls 1
        if (strategy !== shopStrategy) {
          expect(rollWith).toBeGreaterThanOrEqual(rollWithout);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty game deck gracefully', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);
      game.activePlayerIndex = 0;
      player.budget = 100;

      // Empty the deck
      Object.keys(game.deck).forEach((key) => {
        game.deck[key as any] = 0;
      });

      const result = await defaultStrategy.buy(game);

      // Should either buy amusement or return null
      const amusements = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
      expect(result === null || amusements.includes(result as string)).toBe(true);
    });

    it('should handle all amusements owned', async () => {
      const player = createPlayer('Test', defaultStrategy);
      const game = createGame([player]);
      game.activePlayerIndex = 0;
      player.budget = 100;
      player.amusementDeck.Terminal = true;
      player.amusementDeck['Shopping Center'] = true;
      player.amusementDeck['Amusement Park'] = true;
      player.amusementDeck['Radio Tower'] = true;

      const result = await defaultStrategy.buy(game);

      // Should buy regular card or null
      const amusements = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
      if (result !== null) {
        expect(amusements).not.toContain(result);
      }
    });
  });
});
