import { describe, it, expect } from 'vitest';
import { IncomeCalculator } from './IncomeCalculator';
import { Player } from '../entities/Player';
import { DiceRoll } from '../value-objects/DiceRoll';

describe('IncomeCalculator - Income Calculation Bugs', () => {
  describe('calculateIncome should only include green and blue cards', () => {
    it('should NOT include red cards in calculateIncome (BUG)', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Cafe'); // Red card, activates on 3
      const roll = DiceRoll.of([3]);

      const income = IncomeCalculator.calculateIncome(player, roll);

      // Red cards should NOT be included in calculateIncome
      // They should only be calculated by calculateRedCardIncome
      // Expected: 1 from Bakery (green, activates on 2-3)
      // Bug: Currently includes Cafe (red) income too
      expect(income.getValue()).toBe(1); // Only Bakery, NOT Cafe
    });

    it('should NOT include purple cards in calculateIncome (BUG)', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Stadium'); // Purple card, activates on 6
      const roll = DiceRoll.of([6]);

      const income = IncomeCalculator.calculateIncome(player, roll);

      // Purple cards should NOT give basic income
      // They use special abilities instead
      // Expected: 0 (no green or blue cards activate on 6 for default player)
      // Bug: Currently might include Stadium income if it has one
      expect(income.getValue()).toBe(0); // No basic income from purple cards
    });

    it('should only include green and blue cards for active player', () => {
      const player = Player.create('p1', 'Alice');
      // Default player has: Grain Field (blue, activates on 1), Bakery (green, activates on 2-3)
      player.addEstablishment('Cafe'); // Red card (should be excluded)
      const roll = DiceRoll.of([2]);

      const income = IncomeCalculator.calculateIncome(player, roll);

      // Should only get income from Bakery (green)
      // NOT from Cafe (red) even though it activates on 3
      // Roll is 2, so Bakery activates, Cafe doesn't (activates on 3)
      expect(income.getValue()).toBe(1); // Only Bakery
    });

    it('should verify red card is excluded even when it activates', () => {
      const player = Player.create('p1', 'Alice');
      // Remove default cards
      const establishments = new Map();
      establishments.set('Cafe', 1); // Red card, activates on 3
      const noLandmarks = new Set();
      const money = player.getMoney();

      const cleanPlayer = Player.createWithState(
        'p1',
        'Alice',
        money,
        establishments,
        noLandmarks
      );

      const roll = DiceRoll.of([3]);
      const income = IncomeCalculator.calculateIncome(cleanPlayer, roll);

      // Should be 0 because Cafe is red and should be excluded
      // Bug: Currently includes red card income
      expect(income.getValue()).toBe(0); // Red cards excluded from calculateIncome
    });
  });

  describe('card color separation rules', () => {
    it('should demonstrate green cards only for active player', () => {
      const player = Player.create('p1', 'Alice');
      const roll = DiceRoll.of([2]); // Activates Bakery (green)

      const regularIncome = IncomeCalculator.calculateIncome(player, roll);
      const passiveIncome = IncomeCalculator.calculatePassiveIncome(player, roll);

      // Green cards should be in regular income but NOT passive income
      expect(regularIncome.getValue()).toBeGreaterThan(0); // Bakery gives income
      expect(passiveIncome.getValue()).toBe(0); // Bakery is NOT passive (blue)
    });

    it('should demonstrate blue cards activate for all players', () => {
      const player = Player.create('p1', 'Alice');
      const roll = DiceRoll.of([1]); // Activates Grain Field (blue)

      const regularIncome = IncomeCalculator.calculateIncome(player, roll);
      const passiveIncome = IncomeCalculator.calculatePassiveIncome(player, roll);

      // Blue cards should be in BOTH regular and passive income
      expect(regularIncome.getValue()).toBe(1); // Grain Field
      expect(passiveIncome.getValue()).toBe(1); // Grain Field (passive)
    });

    it('should demonstrate red cards only for non-active players', () => {
      const player = Player.create('p1', 'Alice');
      player.addEstablishment('Cafe'); // Red card
      const roll = DiceRoll.of([3]);

      const regularIncome = IncomeCalculator.calculateIncome(player, roll);
      const redIncome = IncomeCalculator.calculateRedCardIncome(player, roll);

      // Red cards should NOT be in regular income
      // Bug: Currently included in regularIncome
      expect(regularIncome.getValue()).toBe(1); // Only Bakery (green)
      expect(redIncome.getValue()).toBe(1); // Cafe (red) separate
    });
  });
});
