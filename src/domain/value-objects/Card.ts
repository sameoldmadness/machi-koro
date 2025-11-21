/**
 * Card Value Objects
 *
 * Immutable card definitions for Machi Koro.
 * Cards are divided into Establishments (purchased cards) and Landmarks (amusement cards).
 */

import { Money } from './Money';

// ==================== Types ====================

export type CardColor = 'blue' | 'green' | 'red' | 'purple';
export type CardKind = 'fruit' | 'cog' | 'grain' | 'tower' | 'cow' | 'bread' | 'factory' | 'coffee';

export type EstablishmentName =
  | 'Apple Garden'
  | 'Bakery'
  | 'Business Center'
  | 'Cafe'
  | 'Cheese Factory'
  | 'Farm'
  | 'Forest'
  | 'Fruit Market'
  | 'Furniture Factory'
  | 'Grain Field'
  | 'Mine'
  | 'Restraunt'
  | 'Shop'
  | 'Stadium'
  | 'TV Center';

export type LandmarkName = 'Terminal' | 'Shopping Center' | 'Amusement Park' | 'Radio Tower';

export type SpecialRule =
  | 'take_2_coins_from_every_player'
  | 'take_5_coins_from_one_player'
  | 'switch_1_non_tower_card_with_one_player';

export type LandmarkAbility =
  | 'may_roll_2_dice'
  | 'plus_1_income_for_coffee_and_bread_cards'
  | 'roll_again_on_double'
  | 'may_reroll_once';

// ==================== Base Card Class ====================

abstract class BaseCard {
  constructor(
    public readonly name: string,
    public readonly cost: Money
  ) { }

  abstract toJSON(): any;
}

// ==================== Establishment Card ====================

export class EstablishmentCard extends BaseCard {
  constructor(
    name: EstablishmentName,
    cost: Money,
    public readonly color: CardColor,
    public readonly kind: CardKind,
    public readonly activationNumbers: number[],
    public readonly income: number = 0,
    public readonly multiplier: Partial<Record<CardKind, number>> = {},
    public readonly specialRule?: SpecialRule,
    public readonly isSingular: boolean = false
  ) {
    super(name, cost);
  }

  /**
   * Check if this card activates on a dice roll
   */
  activatesOn(roll: number): boolean {
    return this.activationNumbers.includes(roll);
  }

  toJSON() {
    return {
      name: this.name,
      cost: this.cost.toJSON(),
      color: this.color,
      kind: this.kind,
      activationNumbers: this.activationNumbers,
      income: this.income,
      multiplier: this.multiplier,
      specialRule: this.specialRule,
      isSingular: this.isSingular,
    };
  }
}

// ==================== Landmark Card ====================

export class LandmarkCard extends BaseCard {
  constructor(
    name: LandmarkName,
    cost: Money,
    public readonly ability: LandmarkAbility
  ) {
    super(name, cost);
  }

  toJSON() {
    return {
      name: this.name,
      cost: this.cost.toJSON(),
      ability: this.ability,
    };
  }
}

// ==================== Card Registry ====================

/**
 * Central registry for all cards in the game
 * Provides type-safe lookups and immutable card definitions
 */
export class CardRegistry {
  private static establishments: Map<EstablishmentName, EstablishmentCard> = new Map();
  private static landmarks: Map<LandmarkName, LandmarkCard> = new Map();

  /**
   * Initialize the registry with all game cards
   */
  static initialize(): void {
    if (this.establishments.size > 0) return; // Already initialized

    // Establishments
    this.registerEstablishment('Grain Field', 1, 'blue', 'grain', [1], 1);
    this.registerEstablishment('Farm', 1, 'blue', 'cow', [2], 1);
    this.registerEstablishment('Bakery', 1, 'green', 'bread', [2, 3], 1);
    this.registerEstablishment('Cafe', 2, 'red', 'coffee', [3], 1);
    this.registerEstablishment('Shop', 2, 'green', 'bread', [4], 3);
    this.registerEstablishment('Forest', 3, 'blue', 'cog', [5], 1);
    this.registerEstablishment('Business Center', 8, 'purple', 'tower', [6], 0, {}, 'switch_1_non_tower_card_with_one_player', true);
    this.registerEstablishment('TV Center', 7, 'purple', 'tower', [6], 0, {}, 'take_5_coins_from_one_player', true);
    this.registerEstablishment('Stadium', 6, 'purple', 'tower', [6], 0, {}, 'take_2_coins_from_every_player', true);
    this.registerEstablishment('Cheese Factory', 5, 'green', 'factory', [7], 0, { cow: 3 });
    this.registerEstablishment('Furniture Factory', 3, 'green', 'factory', [8], 0, { cog: 3 });
    this.registerEstablishment('Mine', 6, 'blue', 'cog', [9], 5);
    this.registerEstablishment('Restraunt', 3, 'red', 'coffee', [9, 10], 2);
    this.registerEstablishment('Apple Garden', 3, 'blue', 'grain', [10], 3);
    this.registerEstablishment('Fruit Market', 2, 'green', 'fruit', [11, 12], 0, { grain: 2 });

    // Landmarks
    this.registerLandmark('Terminal', 4, 'may_roll_2_dice');
    this.registerLandmark('Shopping Center', 10, 'plus_1_income_for_coffee_and_bread_cards');
    this.registerLandmark('Amusement Park', 16, 'roll_again_on_double');
    this.registerLandmark('Radio Tower', 22, 'may_reroll_once');
  }

  private static registerEstablishment(
    name: EstablishmentName,
    cost: number,
    color: CardColor,
    kind: CardKind,
    activationNumbers: number[],
    income: number = 0,
    multiplier: Partial<Record<CardKind, number>> = {},
    specialRule?: SpecialRule,
    isSingular: boolean = false
  ): void {
    this.establishments.set(
      name,
      new EstablishmentCard(
        name,
        Money.of(cost),
        color,
        kind,
        activationNumbers,
        income,
        multiplier,
        specialRule,
        isSingular
      )
    );
  }

  private static registerLandmark(
    name: LandmarkName,
    cost: number,
    ability: LandmarkAbility
  ): void {
    this.landmarks.set(name, new LandmarkCard(name, Money.of(cost), ability));
  }

  /**
   * Get an establishment card
   */
  static getEstablishment(name: EstablishmentName): EstablishmentCard {
    this.initialize();
    const card = this.establishments.get(name);
    if (!card) {
      throw new Error(`Unknown establishment: ${name}`);
    }
    return card;
  }

  /**
   * Get a landmark card
   */
  static getLandmark(name: LandmarkName): LandmarkCard {
    this.initialize();
    const card = this.landmarks.get(name);
    if (!card) {
      throw new Error(`Unknown landmark: ${name}`);
    }
    return card;
  }

  /**
   * Get all establishments
   */
  static getAllEstablishments(): EstablishmentCard[] {
    this.initialize();
    return Array.from(this.establishments.values());
  }

  /**
   * Get all landmarks
   */
  static getAllLandmarks(): LandmarkCard[] {
    this.initialize();
    return Array.from(this.landmarks.values());
  }

  /**
   * Get establishments by color
   */
  static getEstablishmentsByColor(color: CardColor): EstablishmentCard[] {
    this.initialize();
    return this.getAllEstablishments().filter(card => card.color === color);
  }

  /**
   * Get establishments by kind
   */
  static getEstablishmentsByKind(kind: CardKind): EstablishmentCard[] {
    this.initialize();
    return this.getAllEstablishments().filter(card => card.kind === kind);
  }

  /**
   * Check if a name corresponds to an establishment
   */
  static isEstablishment(name: string): name is EstablishmentName {
    this.initialize();
    return this.establishments.has(name as EstablishmentName);
  }

  /**
   * Check if a name corresponds to a landmark
   */
  static isLandmark(name: string): name is LandmarkName {
    this.initialize();
    return this.landmarks.has(name as LandmarkName);
  }
}

// Initialize on module load
CardRegistry.initialize();
