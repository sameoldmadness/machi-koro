import { describe, it, expect } from 'vitest';
import { MarketDeck } from './MarketDeck';
import { CardRegistry } from '../value-objects/Card';

describe('MarketDeck Entity', () => {
  describe('creation', () => {
    it('should create market with default quantities', () => {
      const market = MarketDeck.create('market-1');

      expect(market.id).toBe('market-1');
      expect(market.getAvailableQuantity('Grain Field')).toBe(6);
      expect(market.getAvailableQuantity('Bakery')).toBe(6);
      expect(market.getAvailableQuantity('Stadium')).toBe(4);
    });

    it('should create market with custom quantities', () => {
      const quantities = new Map([
        ['Grain Field' as const, 10],
        ['Bakery' as const, 5],
      ]);

      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.getAvailableQuantity('Grain Field')).toBe(10);
      expect(market.getAvailableQuantity('Bakery')).toBe(5);
      expect(market.getAvailableQuantity('Cafe')).toBe(0);
    });

    it('should create independent instances', () => {
      const market1 = MarketDeck.create('market-1');
      const market2 = MarketDeck.create('market-2');

      // Purchase from one shouldn't affect the other
      market1.purchase('Grain Field');

      expect(market1.getAvailableQuantity('Grain Field')).toBe(5);
      expect(market2.getAvailableQuantity('Grain Field')).toBe(6);
    });
  });

  describe('availability', () => {
    it('should check if card is available', () => {
      const market = MarketDeck.create('market-1');

      expect(market.isAvailable('Grain Field')).toBe(true);
    });

    it('should return false for depleted cards', () => {
      const quantities = new Map([['Grain Field' as const, 0]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.isAvailable('Grain Field')).toBe(false);
    });

    it('should return available quantity', () => {
      const market = MarketDeck.create('market-1');

      expect(market.getAvailableQuantity('Stadium')).toBe(4);
      expect(market.getAvailableQuantity('Bakery')).toBe(6);
    });

    it('should return 0 for unavailable cards', () => {
      const quantities = new Map([['Grain Field' as const, 5]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.getAvailableQuantity('Bakery')).toBe(0);
    });
  });

  describe('purchasing', () => {
    it('should purchase card successfully', () => {
      const market = MarketDeck.create('market-1');

      const card = market.purchase('Grain Field');

      expect(card).toBeDefined();
      expect(card?.name).toBe('Grain Field');
      expect(market.getAvailableQuantity('Grain Field')).toBe(5);
    });

    it('should return undefined when purchasing unavailable card', () => {
      const quantities = new Map([['Grain Field' as const, 0]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const card = market.purchase('Grain Field');

      expect(card).toBeUndefined();
      expect(market.getAvailableQuantity('Grain Field')).toBe(0);
    });

    it('should deplete card after multiple purchases', () => {
      const quantities = new Map([['Stadium' as const, 2]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      market.purchase('Stadium');
      market.purchase('Stadium');

      expect(market.isAvailable('Stadium')).toBe(false);
      expect(market.getAvailableQuantity('Stadium')).toBe(0);
    });

    it('should prevent purchasing when depleted', () => {
      const quantities = new Map([['Cafe' as const, 1]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const card1 = market.purchase('Cafe');
      const card2 = market.purchase('Cafe');

      expect(card1).toBeDefined();
      expect(card2).toBeUndefined();
    });
  });

  describe('getting available cards', () => {
    it('should return all available card names', () => {
      const market = MarketDeck.create('market-1');

      const available = market.getAvailableCards();

      expect(available).toContain('Grain Field');
      expect(available).toContain('Bakery');
      expect(available).toContain('Stadium');
      expect(available.length).toBe(15); // All default cards
    });

    it('should exclude depleted cards', () => {
      const quantities = new Map([
        ['Grain Field' as const, 5],
        ['Bakery' as const, 0],
        ['Cafe' as const, 3],
      ]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const available = market.getAvailableCards();

      expect(available).toContain('Grain Field');
      expect(available).toContain('Cafe');
      expect(available).not.toContain('Bakery');
      expect(available.length).toBe(2);
    });

    it('should return empty array when all depleted', () => {
      const quantities = new Map([
        ['Grain Field' as const, 0],
        ['Bakery' as const, 0],
      ]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const available = market.getAvailableCards();

      expect(available).toEqual([]);
    });
  });

  describe('getting all quantities', () => {
    it('should return all quantities as a map', () => {
      const market = MarketDeck.create('market-1');

      const quantities = market.getAllQuantities();

      expect(quantities.get('Grain Field')).toBe(6);
      expect(quantities.get('Stadium')).toBe(4);
      expect(quantities.size).toBeGreaterThan(0);
    });

    it('should return defensive copy', () => {
      const market = MarketDeck.create('market-1');

      const quantities = market.getAllQuantities();
      quantities.set('Grain Field', 100); // Modify copy

      // Original should be unchanged
      expect(market.getAvailableQuantity('Grain Field')).toBe(6);
    });
  });

  describe('restocking', () => {
    it('should restock cards', () => {
      const quantities = new Map([['Grain Field' as const, 2]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      market.restock('Grain Field', 3);

      expect(market.getAvailableQuantity('Grain Field')).toBe(5);
    });

    it('should restock from zero', () => {
      const quantities = new Map([['Bakery' as const, 0]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      market.restock('Bakery', 4);

      expect(market.isAvailable('Bakery')).toBe(true);
      expect(market.getAvailableQuantity('Bakery')).toBe(4);
    });

    it('should throw error for negative restock quantity', () => {
      const market = MarketDeck.create('market-1');

      expect(() => market.restock('Grain Field', -1)).toThrow(
        'Restock quantity cannot be negative'
      );
    });

    it('should allow restocking with zero', () => {
      const market = MarketDeck.create('market-1');
      const initialQuantity = market.getAvailableQuantity('Grain Field');

      market.restock('Grain Field', 0);

      expect(market.getAvailableQuantity('Grain Field')).toBe(initialQuantity);
    });
  });

  describe('depletion', () => {
    it('should not be depleted with default quantities', () => {
      const market = MarketDeck.create('market-1');

      expect(market.isDepleted()).toBe(false);
    });

    it('should detect when all cards depleted', () => {
      const quantities = new Map([
        ['Grain Field' as const, 0],
        ['Bakery' as const, 0],
      ]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.isDepleted()).toBe(true);
    });

    it('should not be depleted with one card remaining', () => {
      const quantities = new Map([
        ['Grain Field' as const, 0],
        ['Bakery' as const, 1],
      ]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.isDepleted()).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const quantities = new Map([
        ['Grain Field' as const, 5],
        ['Bakery' as const, 3],
      ]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const json = market.toJSON();

      expect(json.id).toBe('market-1');
      expect(json.quantities['Grain Field']).toBe(5);
      expect(json.quantities['Bakery']).toBe(3);
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'market-1',
        quantities: {
          'Grain Field': 5,
          'Bakery': 3,
          'Cafe': 0,
        },
      };

      const market = MarketDeck.fromJSON(json);

      expect(market.id).toBe('market-1');
      expect(market.getAvailableQuantity('Grain Field')).toBe(5);
      expect(market.getAvailableQuantity('Bakery')).toBe(3);
      expect(market.getAvailableQuantity('Cafe')).toBe(0);
    });

    it('should round-trip serialize/deserialize', () => {
      const original = MarketDeck.create('market-1');
      original.purchase('Grain Field');
      original.purchase('Grain Field');

      const json = original.toJSON();
      const restored = MarketDeck.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.getAvailableQuantity('Grain Field')).toBe(4);
      expect(restored.getAllQuantities()).toEqual(original.getAllQuantities());
    });
  });

  describe('entity identity', () => {
    it('should have unique identity', () => {
      const market1 = MarketDeck.create('market-1');
      const market2 = MarketDeck.create('market-2');

      expect(market1.id).not.toBe(market2.id);
    });

    it('should maintain identity after modifications', () => {
      const market = MarketDeck.create('market-1');
      const originalId = market.id;

      market.purchase('Grain Field');
      market.restock('Bakery', 5);

      expect(market.id).toBe(originalId);
    });
  });

  describe('edge cases', () => {
    it('should handle empty market', () => {
      const quantities = new Map<any, number>();
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.isDepleted()).toBe(true);
      expect(market.getAvailableCards()).toEqual([]);
    });

    it('should handle purchasing from empty market', () => {
      const quantities = new Map<any, number>();
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      const card = market.purchase('Grain Field');

      expect(card).toBeUndefined();
    });

    it('should handle large quantities', () => {
      const quantities = new Map([['Grain Field' as const, 1000]]);
      const market = MarketDeck.createWithQuantities('market-1', quantities);

      expect(market.getAvailableQuantity('Grain Field')).toBe(1000);

      market.purchase('Grain Field');

      expect(market.getAvailableQuantity('Grain Field')).toBe(999);
    });
  });
});
