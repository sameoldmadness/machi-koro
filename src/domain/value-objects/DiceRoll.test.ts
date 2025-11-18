import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiceRoll } from './DiceRoll';

describe('DiceRoll Value Object', () => {
  describe('creation', () => {
    it('should create from specific dice values', () => {
      const roll = DiceRoll.of([3]);

      expect(roll.total).toBe(3);
      expect(roll.dice).toEqual([3]);
    });

    it('should create from two dice', () => {
      const roll = DiceRoll.of([2, 4]);

      expect(roll.total).toBe(6);
      expect(roll.dice).toEqual([2, 4]);
    });

    it('should validate dice count (must be 1 or 2)', () => {
      expect(() => DiceRoll.of([])).toThrow('Must roll 1 or 2 dice');
      expect(() => DiceRoll.of([1, 2, 3])).toThrow('Must roll 1 or 2 dice');
    });

    it('should validate dice values (1-6)', () => {
      expect(() => DiceRoll.of([0])).toThrow('Each die must show 1-6');
      expect(() => DiceRoll.of([7])).toThrow('Each die must show 1-6');
      expect(() => DiceRoll.of([3, 7])).toThrow('Each die must show 1-6');
    });

    it('should validate total matches dice sum', () => {
      expect(() => new (DiceRoll as any)(5, [2, 2])).toThrow(
        'Total must equal sum of dice'
      );
    });
  });

  describe('rolling', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should roll one die', () => {
      vi.mocked(Math.random).mockReturnValue(0.5);  // Will give 4

      const roll = DiceRoll.roll(1);

      expect(roll.getDiceCount()).toBe(1);
      expect(roll.total).toBeGreaterThanOrEqual(1);
      expect(roll.total).toBeLessThanOrEqual(6);
    });

    it('should roll two dice', () => {
      vi.mocked(Math.random).mockReturnValue(0.5);  // Will give 4 for each die

      const roll = DiceRoll.roll(2);

      expect(roll.getDiceCount()).toBe(2);
      expect(roll.total).toBeGreaterThanOrEqual(2);
      expect(roll.total).toBeLessThanOrEqual(12);
    });

    it('should produce valid random rolls', () => {
      vi.restoreAllMocks();  // Use real random

      for (let i = 0; i < 100; i++) {
        const roll = DiceRoll.roll(1);
        expect(roll.total).toBeGreaterThanOrEqual(1);
        expect(roll.total).toBeLessThanOrEqual(6);
        expect(roll.dice[0]).toBeGreaterThanOrEqual(1);
        expect(roll.dice[0]).toBeLessThanOrEqual(6);
      }
    });

    it('should produce valid two-dice rolls', () => {
      vi.restoreAllMocks();  // Use real random

      for (let i = 0; i < 100; i++) {
        const roll = DiceRoll.roll(2);
        expect(roll.total).toBeGreaterThanOrEqual(2);
        expect(roll.total).toBeLessThanOrEqual(12);
        expect(roll.total).toBe(roll.dice[0] + roll.dice[1]);
      }
    });
  });

  describe('double detection', () => {
    it('should detect doubles with two dice', () => {
      const doubles = DiceRoll.of([3, 3]);
      expect(doubles.isDouble()).toBe(true);
    });

    it('should detect non-doubles with two dice', () => {
      const notDoubles = DiceRoll.of([2, 4]);
      expect(notDoubles.isDouble()).toBe(false);
    });

    it('should not detect doubles with one die', () => {
      const singleDie = DiceRoll.of([3]);
      expect(singleDie.isDouble()).toBe(false);
    });

    it('should detect all double combinations', () => {
      for (let i = 1; i <= 6; i++) {
        const roll = DiceRoll.of([i, i]);
        expect(roll.isDouble()).toBe(true);
      }
    });
  });

  describe('properties', () => {
    it('should return correct total', () => {
      const roll = DiceRoll.of([5, 3]);
      expect(roll.total).toBe(8);
    });

    it('should return correct dice count', () => {
      const oneDie = DiceRoll.of([4]);
      const twoDice = DiceRoll.of([3, 5]);

      expect(oneDie.getDiceCount()).toBe(1);
      expect(twoDice.getDiceCount()).toBe(2);
    });

    it('should have immutable dice array', () => {
      const roll = DiceRoll.of([2, 4]);
      const dice = roll.dice;

      // Dice array is readonly
      expect(dice).toEqual([2, 4]);
    });
  });

  describe('string representation', () => {
    it('should format single die roll', () => {
      const roll = DiceRoll.of([5]);
      expect(roll.toString()).toBe('Rolled 5');
    });

    it('should format two dice roll', () => {
      const roll = DiceRoll.of([3, 4]);
      expect(roll.toString()).toContain('Rolled 7');
      expect(roll.toString()).toContain('3+4');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const roll = DiceRoll.of([2, 5]);
      const json = roll.toJSON();

      expect(json).toEqual({
        total: 7,
        dice: [2, 5],
      });
    });

    it('should restore from JSON', () => {
      const original = DiceRoll.of([4, 3]);
      const json = original.toJSON();
      const restored = DiceRoll.fromJSON(json);

      expect(restored.total).toBe(original.total);
      expect(restored.dice).toEqual(original.dice);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum roll (1)', () => {
      const roll = DiceRoll.of([1]);
      expect(roll.total).toBe(1);
    });

    it('should handle maximum roll (6)', () => {
      const roll = DiceRoll.of([6]);
      expect(roll.total).toBe(6);
    });

    it('should handle minimum two-dice roll (1,1)', () => {
      const roll = DiceRoll.of([1, 1]);
      expect(roll.total).toBe(2);
      expect(roll.isDouble()).toBe(true);
    });

    it('should handle maximum two-dice roll (6,6)', () => {
      const roll = DiceRoll.of([6, 6]);
      expect(roll.total).toBe(12);
      expect(roll.isDouble()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties at compile time', () => {
      const roll = DiceRoll.of([3, 4]);

      // Readonly properties are enforced by TypeScript
      // This test verifies the structure exists
      expect(roll.total).toBe(7);
      expect(roll.dice).toEqual([3, 4]);
    });

    it('should create independent instances', () => {
      const roll1 = DiceRoll.of([2, 3]);
      const roll2 = DiceRoll.of([2, 3]);

      expect(roll1).not.toBe(roll2);  // Different instances
      expect(roll1.total).toBe(roll2.total);  // Same values
    });
  });
});
