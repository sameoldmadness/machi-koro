import { describe, it, expect } from 'vitest';
import { Money } from './Money';

describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create money with valid amount', () => {
      const money = Money.of(10);
      expect(money.getValue()).toBe(10);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.of(-1)).toThrow('Money cannot be negative');
    });

    it('should throw error for non-integer amount', () => {
      expect(() => Money.of(10.5)).toThrow('Money must be a whole number');
    });

    it('should create zero money', () => {
      const money = Money.of(0);
      expect(money.getValue()).toBe(0);
    });
  });

  describe('arithmetic operations', () => {
    it('should add money correctly', () => {
      const a = Money.of(10);
      const b = Money.of(5);
      const result = a.add(b);

      expect(result.getValue()).toBe(15);
      // Original unchanged (immutable)
      expect(a.getValue()).toBe(10);
      expect(b.getValue()).toBe(5);
    });

    it('should subtract money correctly', () => {
      const a = Money.of(10);
      const b = Money.of(3);
      const result = a.subtract(b);

      expect(result.getValue()).toBe(7);
      // Original unchanged (immutable)
      expect(a.getValue()).toBe(10);
    });

    it('should not go below zero when subtracting', () => {
      const a = Money.of(5);
      const b = Money.of(10);
      const result = a.subtract(b);

      expect(result.getValue()).toBe(0);
    });

    it('should handle zero subtraction', () => {
      const a = Money.of(10);
      const b = Money.of(0);
      const result = a.subtract(b);

      expect(result.getValue()).toBe(10);
    });
  });

  describe('comparisons', () => {
    it('should check if can afford', () => {
      const money = Money.of(10);
      const cost1 = Money.of(5);
      const cost2 = Money.of(15);

      expect(money.canAfford(cost1)).toBe(true);
      expect(money.canAfford(cost2)).toBe(false);
    });

    it('should check equality', () => {
      const a = Money.of(10);
      const b = Money.of(10);
      const c = Money.of(5);

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });

    it('should compare greater than', () => {
      const a = Money.of(10);
      const b = Money.of(5);

      expect(a.isGreaterThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(false);
    });

    it('should compare less than', () => {
      const a = Money.of(5);
      const b = Money.of(10);

      expect(a.isLessThan(b)).toBe(true);
      expect(b.isLessThan(a)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const money = Money.of(100);
      expect(money.toJSON()).toBe(100);
    });

    it('should restore from JSON', () => {
      const original = Money.of(50);
      const json = original.toJSON();
      const restored = Money.fromJSON(json);

      expect(restored.getValue()).toBe(50);
      expect(restored.equals(original)).toBe(true);
    });

    it('should have toString representation', () => {
      const money = Money.of(42);
      expect(money.toString()).toBe('42 coins');
    });
  });

  describe('immutability', () => {
    it('should not allow external modification', () => {
      const money = Money.of(10);
      const copy = money.add(Money.of(5));

      expect(money.getValue()).toBe(10); // Original unchanged
      expect(copy.getValue()).toBe(15); // New instance
    });

    it('should create new instances for all operations', () => {
      const original = Money.of(10);
      const added = original.add(Money.of(5));
      const subtracted = original.subtract(Money.of(3));

      // All different instances
      expect(original).not.toBe(added);
      expect(original).not.toBe(subtracted);
      expect(added).not.toBe(subtracted);
    });
  });
});
