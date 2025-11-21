/**
 * Purchase Domain Service
 *
 * Handles purchasing establishments and landmarks.
 * This is a Domain Service because purchasing involves validation
 * and coordination between Player and MarketDeck entities.
 */

import { Player } from '../entities/Player';
import { MarketDeck } from '../entities/MarketDeck';
import { EstablishmentName, LandmarkName, CardRegistry } from '../value-objects/Card';

/**
 * Result of a purchase attempt
 */
export interface PurchaseResult {
  /**
   * Whether the purchase was successful
   */
  success: boolean;

  /**
   * Description of what happened
   */
  message: string;

  /**
   * Type of card purchased (if successful)
   */
  cardType?: 'establishment' | 'landmark';
}

export class PurchaseService {
  /**
   * Attempt to purchase an establishment from the market
   */
  static purchaseEstablishment(
    player: Player,
    cardName: EstablishmentName,
    market: MarketDeck
  ): PurchaseResult {
    const card = CardRegistry.getEstablishment(cardName);

    // Check if card is available in market
    if (!market.isAvailable(cardName)) {
      return {
        success: false,
        message: `${cardName} is out of stock`,
      };
    }

    // Check if player can afford it (card.cost is already a Money object)
    if (!player.canAfford(card.cost)) {
      return {
        success: false,
        message: `Cannot afford ${cardName} (costs ${card.cost.getValue()}, have ${player.getMoney().getValue()})`,
      };
    }

    // Check singular constraint (can only own one)
    if (card.isSingular && player.hasEstablishment(cardName)) {
      return {
        success: false,
        message: `Already own ${cardName} (singular card)`,
      };
    }

    // Execute purchase
    market.purchase(cardName);
    player.removeMoney(card.cost);
    player.addEstablishment(cardName);

    return {
      success: true,
      message: `Purchased ${cardName} for ${card.cost.getValue()} coins`,
      cardType: 'establishment',
    };
  }

  /**
   * Attempt to purchase (build) a landmark
   */
  static purchaseLandmark(
    player: Player,
    landmarkName: LandmarkName
  ): PurchaseResult {
    const landmark = CardRegistry.getLandmark(landmarkName);

    // Check if already built
    if (player.hasLandmark(landmarkName)) {
      return {
        success: false,
        message: `Already built ${landmarkName}`,
      };
    }

    // Check if player can afford it (landmark.cost is already a Money object)
    if (!player.canAfford(landmark.cost)) {
      return {
        success: false,
        message: `Cannot afford ${landmarkName} (costs ${landmark.cost.getValue()}, have ${player.getMoney().getValue()})`,
      };
    }

    // Execute purchase
    player.removeMoney(landmark.cost);
    player.buildLandmark(landmarkName);

    return {
      success: true,
      message: `Built ${landmarkName} for ${landmark.cost.getValue()} coins`,
      cardType: 'landmark',
    };
  }

  /**
   * Attempt to purchase either an establishment or landmark
   * (convenience method that tries both)
   */
  static purchase(
    player: Player,
    cardName: string,
    market: MarketDeck
  ): PurchaseResult {
    // Try as establishment first
    try {
      const establishmentResult = this.purchaseEstablishment(
        player,
        cardName as EstablishmentName,
        market
      );
      if (establishmentResult.success || establishmentResult.message !== `${cardName} is out of stock`) {
        return establishmentResult;
      }
    } catch (e) {
      // Not a valid establishment name, try landmark
    }

    // Try as landmark
    try {
      return this.purchaseLandmark(player, cardName as LandmarkName);
    } catch (e) {
      return {
        success: false,
        message: `Unknown card: ${cardName}`,
      };
    }
  }
}
