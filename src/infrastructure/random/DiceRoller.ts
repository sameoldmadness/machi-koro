/**
 * Dice Roller
 * Infrastructure service - encapsulates randomness for dice rolling
 */

export interface DiceRollResult {
    total: number;
    rolls: number[];
}

export function rollDice(numDice: number): DiceRollResult {
    const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    return { total, rolls };
}
