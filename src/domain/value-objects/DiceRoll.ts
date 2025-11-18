/**
 * DiceRoll Value Object
 *
 * Represents an immutable dice roll result.
 * Encapsulates dice rolling logic and validation.
 */

export class DiceRoll {
  private constructor(
    public readonly total: number,
    public readonly dice: number[]
  ) {
    if (dice.length < 1 || dice.length > 2) {
      throw new Error('Must roll 1 or 2 dice');
    }
    if (dice.some(d => d < 1 || d > 6)) {
      throw new Error('Each die must show 1-6');
    }
    if (total !== dice.reduce((sum, d) => sum + d, 0)) {
      throw new Error('Total must equal sum of dice');
    }
  }

  /**
   * Roll specified number of dice
   */
  static roll(numberOfDice: 1 | 2): DiceRoll {
    const dice: number[] = [];
    for (let i = 0; i < numberOfDice; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    const total = dice.reduce((sum, d) => sum + d, 0);
    return new DiceRoll(total, dice);
  }

  /**
   * Create from specific values (for testing)
   */
  static of(dice: number[]): DiceRoll {
    const total = dice.reduce((sum, d) => sum + d, 0);
    return new DiceRoll(total, dice);
  }

  /**
   * Check if rolled doubles (both dice show same number)
   */
  isDouble(): boolean {
    return this.dice.length === 2 && this.dice[0] === this.dice[1];
  }

  /**
   * Get number of dice rolled
   */
  getDiceCount(): number {
    return this.dice.length;
  }

  /**
   * String representation
   */
  toString(): string {
    if (this.dice.length === 1) {
      return `Rolled ${this.total}`;
    } else {
      return `Rolled ${this.total} (${this.dice.join('+')}`;
    }
  }

  /**
   * JSON serialization
   */
  toJSON() {
    return {
      total: this.total,
      dice: this.dice,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: { total: number; dice: number[] }): DiceRoll {
    return new DiceRoll(data.total, data.dice);
  }
}
