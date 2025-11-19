import { describe, it, expect } from 'vitest';
import { CardSwapService } from './CardSwapService';
import { Player } from '../entities/Player';

describe('CardSwapService', () => {
  describe('swapCards', () => {
    it('should swap cards successfully', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe'); // Alice has Cafe

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Shop'); // Bob has Shop

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'Shop');

      expect(result.success).toBe(true);
      expect(result.message).toContain('swapped Cafe');
      expect(result.message).toContain('for Shop');
      expect(alice.hasEstablishment('Cafe')).toBe(false);
      expect(alice.hasEstablishment('Shop')).toBe(true);
      expect(bob.hasEstablishment('Cafe')).toBe(true);
      expect(bob.hasEstablishment('Shop')).toBe(false);
    });

    it('should swap starting cards', () => {
      const alice = Player.create('p1', 'Alice');
      // Alice has Grain Field and Bakery by default

      const bob = Player.create('p2', 'Bob');
      // Bob has Grain Field and Bakery by default

      const result = CardSwapService.swapCards(alice, bob, 'Grain Field', 'Bakery');

      expect(result.success).toBe(true);
      expect(alice.getEstablishmentCount('Grain Field')).toBe(0); // Gave away 1
      expect(alice.getEstablishmentCount('Bakery')).toBe(2); // Now has 2
      expect(bob.getEstablishmentCount('Grain Field')).toBe(2); // Now has 2
      expect(bob.getEstablishmentCount('Bakery')).toBe(0); // Gave away 1
    });

    it('should fail when giving purple card', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Stadium'); // Purple card

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Cafe');

      const result = CardSwapService.swapCards(alice, bob, 'Stadium', 'Cafe');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot swap purple cards');
      expect(result.message).toContain('Stadium is purple');
      expect(alice.hasEstablishment('Stadium')).toBe(true); // No change
      expect(bob.hasEstablishment('Cafe')).toBe(true); // No change
    });

    it('should fail when taking purple card', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('TV Center'); // Purple card

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'TV Center');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot swap purple cards');
      expect(result.message).toContain('TV Center is purple');
      expect(alice.hasEstablishment('Cafe')).toBe(true); // No change
      expect(bob.hasEstablishment('TV Center')).toBe(true); // No change
    });

    it('should fail when active player does not have card to give', () => {
      const alice = Player.create('p1', 'Alice');
      // Alice doesn't have Cafe

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Shop');

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'Shop');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Alice does not have Cafe to give');
      expect(alice.hasEstablishment('Shop')).toBe(false); // No change
      expect(bob.hasEstablishment('Shop')).toBe(true); // No change
    });

    it('should fail when other player does not have card to take', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');

      const bob = Player.create('p2', 'Bob');
      // Bob doesn't have Shop

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'Shop');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Bob does not have Shop to take');
      expect(alice.hasEstablishment('Cafe')).toBe(true); // No change
      expect(bob.hasEstablishment('Cafe')).toBe(false); // No change
    });

    it('should handle swapping multiple copies correctly', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');
      alice.addEstablishment('Cafe'); // Alice has 2 Cafes

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Shop');
      bob.addEstablishment('Shop'); // Bob has 2 Shops

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'Shop');

      expect(result.success).toBe(true);
      expect(alice.getEstablishmentCount('Cafe')).toBe(1); // 2 - 1 = 1
      expect(alice.getEstablishmentCount('Shop')).toBe(1); // 0 + 1 = 1
      expect(bob.getEstablishmentCount('Cafe')).toBe(1); // 0 + 1 = 1
      expect(bob.getEstablishmentCount('Shop')).toBe(1); // 2 - 1 = 1
    });

    it('should handle same card swap (edge case)', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');
      alice.addEstablishment('Cafe'); // Alice has 2 Cafes

      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Cafe'); // Bob has 1 Cafe

      const result = CardSwapService.swapCards(alice, bob, 'Cafe', 'Cafe');

      // This should succeed - it's effectively moving a card and moving it back
      expect(result.success).toBe(true);
      expect(alice.getEstablishmentCount('Cafe')).toBe(2); // 2 - 1 + 1 = 2
      expect(bob.getEstablishmentCount('Cafe')).toBe(1); // 1 + 1 - 1 = 1
    });
  });
});
