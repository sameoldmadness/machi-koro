import { describe, it, expect } from 'vitest';
import { SpecialAbilityService, executeStadium, executeTVCenter, getBusinessCenterRequiresInput } from './SpecialAbilityService';
import { Player } from '../entities/Player';
import { Money } from '../value-objects/Money';
import { CardRegistry } from '../value-objects/Card';

describe('SpecialAbilityService', () => {
  describe('Stadium (take 2 coins from each player)', () => {
    it('should take 2 coins from each other player', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addMoney(Money.of(10)); // Alice has 13 total (3 starting + 10)

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(10)); // Bob has 13 total

      const charlie = Player.create('p3', 'Charlie');
      charlie.addMoney(Money.of(10)); // Charlie has 13 total

      const result = executeStadium(alice, [bob, charlie]);

      expect(result.moneyGained.getValue()).toBe(4); // 2 from Bob + 2 from Charlie
      expect(alice.getMoney().getValue()).toBe(17); // 13 + 4
      expect(bob.getMoney().getValue()).toBe(11); // 13 - 2
      expect(charlie.getMoney().getValue()).toBe(11); // 13 - 2
    });

    it('should limit to what players have', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addMoney(Money.of(10));

      const bob = Player.create('p2', 'Bob');
      // Bob only has 3 coins (starting amount)

      const charlie = Player.create('p3', 'Charlie');
      charlie.addMoney(Money.of(1)); // Charlie has 4 coins total

      const result = executeStadium(alice, [bob, charlie]);

      expect(result.moneyGained.getValue()).toBe(4); // 2 from Bob + 2 from Charlie
      expect(alice.getMoney().getValue()).toBe(17); // 13 + 4
      expect(bob.getMoney().getValue()).toBe(1); // 3 - 2
      expect(charlie.getMoney().getValue()).toBe(2); // 4 - 2
    });

    it('should handle players with no money', () => {
      const alice = Player.create('p1', 'Alice');

      const bob = Player.create('p2', 'Bob');
      bob.removeMoney(bob.getMoney()); // Bob has 0 coins

      const result = executeStadium(alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(0);
      expect(alice.getMoney().getValue()).toBe(3); // No change
    });
  });

  describe('TV Center (take 5 coins from richest player)', () => {
    it('should take 5 coins from richest player', () => {
      const alice = Player.create('p1', 'Alice');

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(20)); // Bob has 23 coins (richest)

      const charlie = Player.create('p3', 'Charlie');
      charlie.addMoney(Money.of(5)); // Charlie has 8 coins

      const result = executeTVCenter(alice, [bob, charlie]);

      expect(result.moneyGained.getValue()).toBe(5);
      expect(alice.getMoney().getValue()).toBe(8); // 3 + 5
      expect(bob.getMoney().getValue()).toBe(18); // 23 - 5
      expect(charlie.getMoney().getValue()).toBe(8); // No change
    });

    it('should limit to what richest player has', () => {
      const alice = Player.create('p1', 'Alice');

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(1)); // Bob has 4 coins (richest, but less than 5)

      const result = executeTVCenter(alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(4); // Limited to Bob's money
      expect(alice.getMoney().getValue()).toBe(7); // 3 + 4
      expect(bob.getMoney().getValue()).toBe(0); // 4 - 4
    });

    it('should handle no other players', () => {
      const alice = Player.create('p1', 'Alice');

      const result = executeTVCenter(alice, []);

      expect(result.moneyGained.getValue()).toBe(0);
      expect(alice.getMoney().getValue()).toBe(3); // No change
    });

    it('should pick player with most money when tied', () => {
      const alice = Player.create('p1', 'Alice');

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(10)); // Bob has 13 coins

      const charlie = Player.create('p3', 'Charlie');
      charlie.addMoney(Money.of(10)); // Charlie has 13 coins (tied)

      const result = executeTVCenter(alice, [bob, charlie]);

      // Should take from one of them (reduce returns first if equal)
      expect(result.moneyGained.getValue()).toBe(5);
      expect(alice.getMoney().getValue()).toBe(8);
      // One of them should have 8 coins left
      const totalOtherMoney = bob.getMoney().getValue() + charlie.getMoney().getValue();
      expect(totalOtherMoney).toBe(21); // 13 + 13 - 5 = 21
    });
  });

  describe('SpecialAbilityService.executeSpecialAbility', () => {
    it('should execute Stadium ability', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Stadium');

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(10));

      const stadium = CardRegistry.getEstablishment('Stadium');
      const result = SpecialAbilityService.executeSpecialAbility(stadium, alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(2);
      expect(alice.getMoney().getValue()).toBe(5); // 3 + 2
    });

    it('should execute TV Center ability', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('TV Center');

      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(10));

      const tvCenter = CardRegistry.getEstablishment('TV Center');
      const result = SpecialAbilityService.executeSpecialAbility(tvCenter, alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(5);
      expect(alice.getMoney().getValue()).toBe(8); // 3 + 5
    });

    it('should execute Business Center ability (requires input)', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Business Center');

      const bob = Player.create('p2', 'Bob');

      const businessCenter = CardRegistry.getEstablishment('Business Center');
      const result = SpecialAbilityService.executeSpecialAbility(businessCenter, alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(0);
    });

    it('should handle card with no special rule', () => {
      const alice = Player.create('p1', 'Alice');
      const bob = Player.create('p2', 'Bob');

      const bakery = CardRegistry.getEstablishment('Bakery');
      const result = SpecialAbilityService.executeSpecialAbility(bakery, alice, [bob]);

      expect(result.moneyGained.getValue()).toBe(0);
      expect(result.description).toBe('No special ability');
    });
  });
});
