import { describe, it, expect } from 'vitest';
import { IncomeCalculator } from './IncomeCalculator';
import { Player } from '../entities/Player';
import { DiceRoll } from '../value-objects/DiceRoll';
import { Money } from '../value-objects/Money';

describe('IncomeCalculator Domain Service', () => {
  describe('basic income calculation', () => {
    it('should calculate income for single card', () => {
      const player = Player.create('p1', 'Alice');
      const roll = DiceRoll.of([1]); // Activates Grain Field

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(1); // Grain Field gives 1 coin
    });

    it('should calculate income for multiple matching cards', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Grain Field'); // Now has 2 Grain Fields
      const roll = DiceRoll.of([1]);

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(2); // 2x Grain Field = 2 coins
    });

    it('should return zero for non-matching dice roll', () => {
      const player = Player.create('p1', 'Alice');
      const roll = DiceRoll.of([6]); // Doesn't activate any starting cards

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(0);
    });

    it('should calculate income for Bakery on 2 or 3', () => {
      const player = Player.create('p1', 'Alice');
      const roll2 = DiceRoll.of([2]);
      const roll3 = DiceRoll.of([3]);

      const income2 = IncomeCalculator.calculateIncome(player, roll2);
      const income3 = IncomeCalculator.calculateIncome(player, roll3);

      expect(income2.getValue()).toBe(1); // Bakery gives 1 coin
      expect(income3.getValue()).toBe(1); // Bakery gives 1 coin
    });
  });

  describe('multiplier cards', () => {
    it('should calculate income for Cheese Factory with cows', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Farm'); // cow
      player.addEstablishment('Farm'); // cow
      player.addEstablishment('Cheese Factory'); // Multiplies cows by 3
      const roll = DiceRoll.of([3, 4]); // Total 7 - Activates Cheese Factory

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(6); // 2 cows * 3 = 6 coins
    });

    it('should calculate income for Furniture Factory with cogs', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Forest'); // cog
      player.addEstablishment('Mine'); // cog
      player.addEstablishment('Furniture Factory'); // Multiplies cogs by 3
      const roll = DiceRoll.of([4, 4]); // Total 8 - Activates Furniture Factory

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(6); // 2 cogs * 3 = 6 coins
    });

    it('should calculate income for Fruit Market with grain', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Apple Garden'); // grain
      player.addEstablishment('Fruit Market'); // Multiplies grain by 2
      const roll = DiceRoll.of([5, 6]); // Total 11 - Activates Fruit Market

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(4); // (1 Grain Field + 1 Apple Garden) * 2 = 4 coins
    });

    it('should return zero for multiplier card with no matching cards', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Cheese Factory'); // No cows
      const roll = DiceRoll.of([3, 4]); // Total 7

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(0);
    });
  });

  describe('landmark bonuses', () => {
    it('should apply Shopping Center bonus to bread cards', () => {
      const player = Player.create('p1', 'Alice');
      player.buildLandmark('Shopping Center');
      const roll = DiceRoll.of([2]); // Activates Bakery

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(2); // Bakery (1) + Shopping Center bonus (1)
    });

    it('should apply Shopping Center bonus to coffee cards', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Cafe');
      player.buildLandmark('Shopping Center');
      const roll = DiceRoll.of([3]); // Activates Bakery and Cafe

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(4); // Bakery (1+1) + Cafe (1+1)
    });

    it('should not apply Shopping Center bonus to non-bread/coffee cards', () => {
      const player = Player.create('p1', 'Alice');
      player.buildLandmark('Shopping Center');
      const roll = DiceRoll.of([1]); // Activates Grain Field

      const income = IncomeCalculator.calculateIncome(player, roll);

      expect(income.getValue()).toBe(1); // No bonus for grain cards
    });
  });

  describe('hostile income (red cards)', () => {
    it('should calculate steal amount from Cafe', () => {
      const target = Player.create('p1', 'Alice');
      target.addEstablishment('Cafe');
      const active = Player.create('p2', 'Bob');
      active.addMoney(Money.of(10));
      const roll = DiceRoll.of([3]);

      const steal = IncomeCalculator.calculateHostileIncome(target, active, roll);

      expect(steal.getValue()).toBe(1); // Cafe steals 1 coin
    });

    it('should calculate steal amount from Restraunt', () => {
      const target = Player.create('p1', 'Alice');
      target.addEstablishment('Restraunt');
      const active = Player.create('p2', 'Bob');
      active.addMoney(Money.of(10));
      const roll = DiceRoll.of([3, 6]); // Total 9

      const steal = IncomeCalculator.calculateHostileIncome(target, active, roll);

      expect(steal.getValue()).toBe(2); // Restraunt steals 2 coins
    });

    it('should apply Shopping Center bonus to red cards', () => {
      const target = Player.create('p1', 'Alice');
      target.addEstablishment('Cafe');
      target.buildLandmark('Shopping Center');
      const active = Player.create('p2', 'Bob');
      active.addMoney(Money.of(10));
      const roll = DiceRoll.of([3]);

      const steal = IncomeCalculator.calculateHostileIncome(target, active, roll);

      expect(steal.getValue()).toBe(2); // Cafe (1) + Shopping Center (1)
    });

    it('should not steal more than active player has', () => {
      const target = Player.create('p1', 'Alice');
      target.addEstablishment('Cafe');
      target.addEstablishment('Cafe');
      target.addEstablishment('Cafe');
      const active = Player.create('p2', 'Bob');
      // Bob only has 3 coins starting
      const roll = DiceRoll.of([3]);

      const steal = IncomeCalculator.calculateHostileIncome(target, active, roll);

      expect(steal.getValue()).toBe(3); // Limited by Bob's money
    });

    it('should return zero for non-hostile cards', () => {
      const target = Player.create('p1', 'Alice');
      const active = Player.create('p2', 'Bob');
      const roll = DiceRoll.of([1]); // Activates Grain Field (blue, not red)

      const steal = IncomeCalculator.calculateHostileIncome(target, active, roll);

      expect(steal.getValue()).toBe(0);
    });
  });

  describe('special ability income (purple cards)', () => {
    it('should calculate Stadium income (2 coins from each player)', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Stadium');
      const bob = Player.create('p2', 'Bob');
      bob.addMoney(Money.of(10));
      const charlie = Player.create('p3', 'Charlie');
      charlie.addMoney(Money.of(10));
      const allPlayers = [player, bob, charlie];
      const roll = DiceRoll.of([6]);

      const income = IncomeCalculator.calculateSpecialAbilityIncome(player, roll, allPlayers);

      expect(income.getValue()).toBe(4); // 2 coins from Bob + 2 from Charlie
    });

    it('should limit Stadium income to what players have', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Stadium');
      const bob = Player.create('p2', 'Bob');
      // Bob only has 3 coins starting
      const charlie = Player.create('p3', 'Charlie');
      // Charlie only has 3 coins starting
      const allPlayers = [player, bob, charlie];
      const roll = DiceRoll.of([6]);

      const income = IncomeCalculator.calculateSpecialAbilityIncome(player, roll, allPlayers);

      expect(income.getValue()).toBe(4); // Limited by players' money (2+2)
    });

    it('should calculate TV Center potential income', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('TV Center');
      const allPlayers = [player, Player.create('p2', 'Bob')];
      const roll = DiceRoll.of([6]);

      const income = IncomeCalculator.calculateSpecialAbilityIncome(player, roll, allPlayers);

      expect(income.getValue()).toBe(5); // TV Center gives 5 coins
    });

    it('should return zero for Business Center', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Business Center');
      const allPlayers = [player, Player.create('p2', 'Bob')];
      const roll = DiceRoll.of([6]);

      const income = IncomeCalculator.calculateSpecialAbilityIncome(player, roll, allPlayers);

      expect(income.getValue()).toBe(0); // Business Center doesn't give coins
    });
  });

  describe('player filtering', () => {
    it('should identify players with passive income', () => {
      const alice = Player.create('p1', 'Alice');
      // Alice has Grain Field (blue) and Bakery (green) by default
      const bob = Player.create('p2', 'Bob');
      bob.addEstablishment('Farm'); // Activates on 2 (blue)
      const charlie = Player.create('p3', 'Charlie');
      charlie.addEstablishment('Shop'); // Doesn't activate on 2 (green, not blue)
      const allPlayers = [alice, bob, charlie];
      const roll = DiceRoll.of([2]);

      const passivePlayers = IncomeCalculator.getPassiveIncomePlayers(allPlayers, roll);

      expect(passivePlayers.length).toBe(1); // Only Bob has passive card (Farm) that activates on 2
      expect(passivePlayers).toContain(bob);
      expect(passivePlayers).not.toContain(alice); // Bakery is green (active), not blue (passive)
      expect(passivePlayers).not.toContain(charlie);
    });

    it('should identify players with hostile cards', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');
      const bob = Player.create('p2', 'Bob');
      const charlie = Player.create('p3', 'Charlie');
      charlie.addEstablishment('Cafe');
      const allPlayers = [alice, bob, charlie];
      const roll = DiceRoll.of([3]);

      const hostilePlayers = IncomeCalculator.getHostilePlayers(allPlayers, bob, roll);

      expect(hostilePlayers.length).toBe(2); // Alice and Charlie
      expect(hostilePlayers).toContain(alice);
      expect(hostilePlayers).toContain(charlie);
      expect(hostilePlayers).not.toContain(bob);
    });

    it('should exclude active player from hostile players', () => {
      const alice = Player.create('p1', 'Alice');
      alice.addEstablishment('Cafe');
      const allPlayers = [alice];
      const roll = DiceRoll.of([3]);

      const hostilePlayers = IncomeCalculator.getHostilePlayers(allPlayers, alice, roll);

      expect(hostilePlayers.length).toBe(0);
    });
  });
});
