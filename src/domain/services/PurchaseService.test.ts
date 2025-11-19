import { describe, it, expect } from 'vitest';
import { PurchaseService } from './PurchaseService';
import { Player } from '../entities/Player';
import { MarketDeck } from '../entities/MarketDeck';
import { Money } from '../value-objects/Money';

describe('PurchaseService', () => {
  describe('purchaseEstablishment', () => {
    it('should purchase establishment successfully', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10)); // Alice has 13 coins total
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Cafe', market);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Purchased Cafe for 2 coins');
      expect(result.cardType).toBe('establishment');
      expect(player.getMoney().getValue()).toBe(11); // 13 - 2
      expect(player.hasEstablishment('Cafe')).toBe(true);
      expect(market.getAvailableQuantity('Cafe')).toBe(5); // 6 - 1
    });

    it('should fail when card is out of stock', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      const emptyMarket = MarketDeck.createWithQuantities('market-1', new Map([['Cafe' as const, 0]]));

      const result = PurchaseService.purchaseEstablishment(player, 'Cafe', emptyMarket);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cafe is out of stock');
      expect(player.getMoney().getValue()).toBe(13); // No change
      expect(player.hasEstablishment('Cafe')).toBe(false);
    });

    it('should fail when player cannot afford', () => {
      const player = Player.create('p1', 'Alice');
      // Player only has 3 coins (starting amount)
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Mine', market); // Mine costs 6

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot afford Mine');
      expect(player.getMoney().getValue()).toBe(3); // No change
      expect(player.hasEstablishment('Mine')).toBe(false);
      expect(market.getAvailableQuantity('Mine')).toBe(6); // No change
    });

    it('should fail when player already owns singular card', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      player.addEstablishment('Stadium'); // Add Stadium first
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Stadium', market);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Already own Stadium (singular card)');
      expect(player.getMoney().getValue()).toBe(13); // No change
      expect(market.getAvailableQuantity('Stadium')).toBe(5); // No change
    });

    it('should allow purchasing multiple non-singular cards', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      player.addEstablishment('Cafe'); // Add one Cafe
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Cafe', market);

      expect(result.success).toBe(true);
      expect(player.getEstablishmentCount('Cafe')).toBe(2); // Now has 2 Cafes
    });
  });

  describe('purchaseLandmark', () => {
    it('should purchase landmark successfully', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10)); // Alice has 13 coins total

      const result = PurchaseService.purchaseLandmark(player, 'Terminal');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Built Terminal for 4 coins');
      expect(result.cardType).toBe('landmark');
      expect(player.getMoney().getValue()).toBe(9); // 13 - 4
      expect(player.hasLandmark('Terminal')).toBe(true);
    });

    it('should fail when player cannot afford landmark', () => {
      const player = Player.create('p1', 'Alice');
      // Player only has 3 coins

      const result = PurchaseService.purchaseLandmark(player, 'Terminal'); // Terminal costs 4

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot afford Terminal');
      expect(player.getMoney().getValue()).toBe(3); // No change
      expect(player.hasLandmark('Terminal')).toBe(false);
    });

    it('should fail when landmark already built', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      // Simulate previous purchase of Terminal (costs 4)
      player.buildLandmark('Terminal');
      player.removeMoney(Money.of(4));

      const result = PurchaseService.purchaseLandmark(player, 'Terminal');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Already built Terminal');
      expect(player.getMoney().getValue()).toBe(9); // Only paid once (13 - 4)
    });

    it('should purchase expensive landmark', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(20)); // Alice has 23 coins total

      const result = PurchaseService.purchaseLandmark(player, 'Radio Tower'); // Radio Tower costs 22

      expect(result.success).toBe(true);
      expect(player.getMoney().getValue()).toBe(1); // 23 - 22
      expect(player.hasLandmark('Radio Tower')).toBe(true);
    });
  });

  describe('purchase (convenience method)', () => {
    it('should purchase establishment when given establishment name', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchase(player, 'Cafe', market);

      expect(result.success).toBe(true);
      expect(result.cardType).toBe('establishment');
      expect(player.hasEstablishment('Cafe')).toBe(true);
    });

    it('should purchase landmark when given landmark name', () => {
      const player = Player.create('p1', 'Alice');
      player.addMoney(Money.of(10));
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchase(player, 'Terminal', market);

      expect(result.success).toBe(true);
      expect(result.cardType).toBe('landmark');
      expect(player.hasLandmark('Terminal')).toBe(true);
    });

    it('should fail for unknown card name', () => {
      const player = Player.create('p1', 'Alice');
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchase(player, 'Unknown Card', market);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown card');
    });
  });

  describe('edge cases', () => {
    it('should handle exact money match for establishment', () => {
      const player = Player.create('p1', 'Alice');
      // Player has exactly 3 coins (starting amount) - enough for Bakery which costs 1
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Grain Field', market); // Grain Field costs 1

      expect(result.success).toBe(true);
      expect(player.getMoney().getValue()).toBe(2); // 3 - 1
    });

    it('should handle player with no money', () => {
      const player = Player.create('p1', 'Alice');
      player.removeMoney(player.getMoney()); // Remove all money
      const market = MarketDeck.create('market-1');

      const result = PurchaseService.purchaseEstablishment(player, 'Grain Field', market);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot afford');
    });
  });
});
