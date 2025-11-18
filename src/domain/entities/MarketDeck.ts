/**
 * MarketDeck Entity
 *
 * Manages the market deck of available establishment cards for purchase.
 * This is an Entity (has identity and mutable state).
 */

import { EstablishmentCard, EstablishmentName, CardRegistry } from '../value-objects/Card';

/**
 * Configuration for initial card quantities in the market
 */
const DEFAULT_CARD_QUANTITIES: Record<EstablishmentName, number> = {
  'Grain Field': 6,
  'Farm': 6,
  'Bakery': 6,
  'Cafe': 6,
  'Shop': 6,
  'Forest': 6,
  'Business Center': 5, // Fixed: was 4, should be 5 per game.ts
  'TV Center': 5, // Fixed: was 4, should be 5 per game.ts
  'Stadium': 5, // Fixed: was 4, should be 5 per game.ts
  'Cheese Factory': 6,
  'Furniture Factory': 6,
  'Mine': 6,
  'Restraunt': 6,
  'Apple Garden': 6,
  'Fruit Market': 6,
};

export class MarketDeck {
  private readonly quantities: Map<EstablishmentName, number>;

  private constructor(
    public readonly id: string,
    quantities: Map<EstablishmentName, number>
  ) {
    this.quantities = new Map(quantities); // Defensive copy
  }

  /**
   * Create a new market deck with default quantities
   */
  static create(id: string): MarketDeck {
    const quantities = new Map<EstablishmentName, number>();
    for (const [name, quantity] of Object.entries(DEFAULT_CARD_QUANTITIES)) {
      quantities.set(name as EstablishmentName, quantity);
    }
    return new MarketDeck(id, quantities);
  }

  /**
   * Create from specific quantities (for testing or custom games)
   */
  static createWithQuantities(
    id: string,
    quantities: Map<EstablishmentName, number>
  ): MarketDeck {
    return new MarketDeck(id, quantities);
  }

  /**
   * Check if a card is available for purchase
   */
  isAvailable(cardName: EstablishmentName): boolean {
    const quantity = this.quantities.get(cardName) ?? 0;
    return quantity > 0;
  }

  /**
   * Get available quantity of a card
   */
  getAvailableQuantity(cardName: EstablishmentName): number {
    return this.quantities.get(cardName) ?? 0;
  }

  /**
   * Purchase a card from the market
   * Returns the card if successful, undefined if not available
   */
  purchase(cardName: EstablishmentName): EstablishmentCard | undefined {
    if (!this.isAvailable(cardName)) {
      return undefined;
    }

    const currentQuantity = this.quantities.get(cardName)!;
    this.quantities.set(cardName, currentQuantity - 1);

    return CardRegistry.getEstablishment(cardName);
  }

  /**
   * Get all available card names
   */
  getAvailableCards(): EstablishmentName[] {
    const available: EstablishmentName[] = [];
    for (const [cardName, quantity] of this.quantities.entries()) {
      if (quantity > 0) {
        available.push(cardName);
      }
    }
    return available;
  }

  /**
   * Get all cards with their quantities
   */
  getAllQuantities(): Map<EstablishmentName, number> {
    return new Map(this.quantities); // Return defensive copy
  }

  /**
   * Restock a card (for testing or special rules)
   */
  restock(cardName: EstablishmentName, quantity: number): void {
    if (quantity < 0) {
      throw new Error('Restock quantity cannot be negative');
    }
    const currentQuantity = this.quantities.get(cardName) ?? 0;
    this.quantities.set(cardName, currentQuantity + quantity);
  }

  /**
   * Check if market is depleted (no cards available)
   */
  isDepleted(): boolean {
    for (const quantity of this.quantities.values()) {
      if (quantity > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    const quantitiesObj: Record<string, number> = {};
    for (const [cardName, quantity] of this.quantities.entries()) {
      quantitiesObj[cardName] = quantity;
    }

    return {
      id: this.id,
      quantities: quantitiesObj,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: { id: string; quantities: Record<string, number> }): MarketDeck {
    const quantities = new Map<EstablishmentName, number>();
    for (const [cardName, quantity] of Object.entries(data.quantities)) {
      quantities.set(cardName as EstablishmentName, quantity);
    }
    return new MarketDeck(data.id, quantities);
  }
}
