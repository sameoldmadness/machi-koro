/**
 * Money Value Object
 *
 * Represents an immutable amount of coins in the game.
 * Enforces business rules:
 * - Cannot be negative
 * - All operations return new instances
 * - Type-safe arithmetic
 */

export class Money {
  private constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money cannot be negative');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('Money must be a whole number');
    }
  }

  /**
   * Create Money from a number value
   */
  static of(amount: number): Money {
    return new Money(amount);
  }

  /**
   * Get the numeric value
   */
  getValue(): number {
    return this.amount;
  }

  /**
   * Add money (immutable)
   */
  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  /**
   * Subtract money (immutable, cannot go below zero)
   */
  subtract(other: Money): Money {
    const newAmount = Math.max(0, this.amount - other.amount);
    return new Money(newAmount);
  }

  /**
   * Check if can afford a cost
   */
  canAfford(cost: Money): boolean {
    return this.amount >= cost.amount;
  }

  /**
   * Check equality
   */
  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  /**
   * Compare amounts
   */
  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.amount} coins`;
  }

  /**
   * JSON serialization
   */
  toJSON(): number {
    return this.amount;
  }

  /**
   * Create from JSON
   */
  static fromJSON(value: number): Money {
    return Money.of(value);
  }
}
