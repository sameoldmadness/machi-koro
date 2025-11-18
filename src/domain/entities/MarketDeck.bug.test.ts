import { describe, it, expect } from 'vitest';
import { MarketDeck } from './MarketDeck';

describe('MarketDeck - Card Quantity Bugs', () => {
  describe('purple card quantities', () => {
    it('should have 5 Business Centers available (currently has 4 - BUG)', () => {
      const market = MarketDeck.create('market-1');

      const quantity = market.getAvailableQuantity('Business Center');

      expect(quantity).toBe(5); // Reference: game.ts has 5
    });

    it('should have 5 TV Centers available (currently has 4 - BUG)', () => {
      const market = MarketDeck.create('market-1');

      const quantity = market.getAvailableQuantity('TV Center');

      expect(quantity).toBe(5); // Reference: game.ts has 5
    });

    it('should have 5 Stadiums available (currently has 4 - BUG)', () => {
      const market = MarketDeck.create('market-1');

      const quantity = market.getAvailableQuantity('Stadium');

      expect(quantity).toBe(5); // Reference: game.ts has 5
    });
  });
});
