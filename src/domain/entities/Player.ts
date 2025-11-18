/**
 * Player Entity
 *
 * Represents a player in the game with their money, cards, and landmarks.
 * This is an Entity (has identity and mutable state).
 */

import { Money } from '../value-objects/Money';
import {
  EstablishmentCard,
  LandmarkCard,
  EstablishmentName,
  LandmarkName,
  CardRegistry,
} from '../value-objects/Card';

/**
 * Player entity managing player state and actions
 */
export class Player {
  private money: Money;
  private readonly establishments: Map<EstablishmentName, number>;
  private readonly landmarks: Set<LandmarkName>;

  private constructor(
    public readonly id: string,
    public readonly name: string,
    money: Money,
    establishments: Map<EstablishmentName, number>,
    landmarks: Set<LandmarkName>
  ) {
    this.money = money;
    this.establishments = new Map(establishments); // Defensive copy
    this.landmarks = new Set(landmarks); // Defensive copy
  }

  /**
   * Create a new player with starting money and cards
   */
  static create(id: string, name: string): Player {
    const startingMoney = Money.of(3);
    const startingEstablishments = new Map<EstablishmentName, number>([
      ['Grain Field', 1],
      ['Bakery', 1],
    ]);
    const startingLandmarks = new Set<LandmarkName>();

    return new Player(id, name, startingMoney, startingEstablishments, startingLandmarks);
  }

  /**
   * Create player with custom state (for testing or loading)
   */
  static createWithState(
    id: string,
    name: string,
    money: Money,
    establishments: Map<EstablishmentName, number>,
    landmarks: Set<LandmarkName>
  ): Player {
    return new Player(id, name, money, establishments, landmarks);
  }

  // ==================== Money Operations ====================

  /**
   * Get current money amount
   */
  getMoney(): Money {
    return this.money;
  }

  /**
   * Add money to player
   */
  addMoney(amount: Money): void {
    this.money = this.money.add(amount);
  }

  /**
   * Remove money from player (won't go below 0)
   */
  removeMoney(amount: Money): void {
    this.money = this.money.subtract(amount);
  }

  /**
   * Check if player can afford a cost
   */
  canAfford(cost: Money): boolean {
    return this.money.canAfford(cost);
  }

  // ==================== Establishment Operations ====================

  /**
   * Add an establishment card to player's collection
   */
  addEstablishment(cardName: EstablishmentName): void {
    const currentCount = this.establishments.get(cardName) ?? 0;
    this.establishments.set(cardName, currentCount + 1);
  }

  /**
   * Remove an establishment card from player's collection
   * Returns true if successful, false if player doesn't own the card
   */
  removeEstablishment(cardName: EstablishmentName): boolean {
    const currentCount = this.establishments.get(cardName) ?? 0;
    if (currentCount === 0) {
      return false;
    }

    if (currentCount === 1) {
      this.establishments.delete(cardName);
    } else {
      this.establishments.set(cardName, currentCount - 1);
    }
    return true;
  }

  /**
   * Get count of a specific establishment
   */
  getEstablishmentCount(cardName: EstablishmentName): number {
    return this.establishments.get(cardName) ?? 0;
  }

  /**
   * Check if player owns at least one of an establishment
   */
  hasEstablishment(cardName: EstablishmentName): boolean {
    return this.getEstablishmentCount(cardName) > 0;
  }

  /**
   * Get all owned establishments
   */
  getEstablishments(): Map<EstablishmentName, number> {
    return new Map(this.establishments); // Defensive copy
  }

  /**
   * Get all owned establishments as cards
   */
  getEstablishmentCards(): EstablishmentCard[] {
    const cards: EstablishmentCard[] = [];
    for (const [cardName, count] of this.establishments.entries()) {
      const card = CardRegistry.getEstablishment(cardName);
      for (let i = 0; i < count; i++) {
        cards.push(card);
      }
    }
    return cards;
  }

  // ==================== Landmark Operations ====================

  /**
   * Build (activate) a landmark
   */
  buildLandmark(landmarkName: LandmarkName): void {
    this.landmarks.add(landmarkName);
  }

  /**
   * Check if a landmark is built
   */
  hasLandmark(landmarkName: LandmarkName): boolean {
    return this.landmarks.has(landmarkName);
  }

  /**
   * Get all built landmarks
   */
  getLandmarks(): Set<LandmarkName> {
    return new Set(this.landmarks); // Defensive copy
  }

  /**
   * Get all built landmarks as cards
   */
  getLandmarkCards(): LandmarkCard[] {
    return Array.from(this.landmarks).map((name) => CardRegistry.getLandmark(name));
  }

  /**
   * Check if player has won (all 4 landmarks built)
   */
  hasWon(): boolean {
    return this.landmarks.size === 4;
  }

  // ==================== Query Operations ====================

  /**
   * Get total number of establishments owned
   */
  getTotalEstablishmentCount(): number {
    let total = 0;
    for (const count of this.establishments.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Get count of establishments of a specific kind
   */
  getEstablishmentCountByKind(kind: string): number {
    let count = 0;
    for (const [cardName, quantity] of this.establishments.entries()) {
      const card = CardRegistry.getEstablishment(cardName);
      if (card.kind === kind) {
        count += quantity;
      }
    }
    return count;
  }

  // ==================== Serialization ====================

  /**
   * Serialize to JSON
   */
  toJSON() {
    const establishmentsObj: Record<string, number> = {};
    for (const [cardName, count] of this.establishments.entries()) {
      establishmentsObj[cardName] = count;
    }

    return {
      id: this.id,
      name: this.name,
      money: this.money.toJSON(),
      establishments: establishmentsObj,
      landmarks: Array.from(this.landmarks),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: {
    id: string;
    name: string;
    money: number;
    establishments: Record<string, number>;
    landmarks: string[];
  }): Player {
    const money = Money.fromJSON(data.money);

    const establishments = new Map<EstablishmentName, number>();
    for (const [cardName, count] of Object.entries(data.establishments)) {
      establishments.set(cardName as EstablishmentName, count);
    }

    const landmarks = new Set<LandmarkName>(data.landmarks as LandmarkName[]);

    return new Player(data.id, data.name, money, establishments, landmarks);
  }
}
