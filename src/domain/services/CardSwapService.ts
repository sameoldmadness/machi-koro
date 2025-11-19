/**
 * CardSwap Domain Service
 *
 * Handles Business Center card swapping between players.
 * This is a Domain Service because swapping involves validation
 * and coordination between two Player entities.
 */

import { Player } from '../entities/Player';
import { EstablishmentName, CardRegistry } from '../value-objects/Card';

/**
 * Result of a card swap attempt
 */
export interface CardSwapResult {
  /**
   * Whether the swap was successful
   */
  success: boolean;

  /**
   * Description of what happened
   */
  message: string;
}

export class CardSwapService {
  /**
   * Attempt to swap one establishment card with another player
   *
   * Business Center rules:
   * - Cannot swap purple cards (landmarks)
   * - Player must own the card they're giving
   * - Other player must own the card being taken
   *
   * @param activePlayer The player initiating the swap (has Business Center)
   * @param otherPlayer The player being swapped with
   * @param giveCardName The card the active player is giving away
   * @param takeCardName The card the active player wants to receive
   */
  static swapCards(
    activePlayer: Player,
    otherPlayer: Player,
    giveCardName: EstablishmentName,
    takeCardName: EstablishmentName
  ): CardSwapResult {
    // Validate cards exist
    let giveCard, takeCard;
    try {
      giveCard = CardRegistry.getEstablishment(giveCardName);
      takeCard = CardRegistry.getEstablishment(takeCardName);
    } catch (e) {
      return {
        success: false,
        message: `Invalid card name: ${(e as Error).message}`,
      };
    }

    // Validate: cannot swap purple cards (tower landmarks)
    if (giveCard.color === 'purple') {
      return {
        success: false,
        message: `Cannot swap purple cards (${giveCardName} is purple)`,
      };
    }

    if (takeCard.color === 'purple') {
      return {
        success: false,
        message: `Cannot swap purple cards (${takeCardName} is purple)`,
      };
    }

    // Validate: active player must have the card to give
    if (!activePlayer.hasEstablishment(giveCardName)) {
      return {
        success: false,
        message: `${activePlayer.name} does not have ${giveCardName} to give`,
      };
    }

    // Validate: other player must have the card to take
    if (!otherPlayer.hasEstablishment(takeCardName)) {
      return {
        success: false,
        message: `${otherPlayer.name} does not have ${takeCardName} to take`,
      };
    }

    // Execute swap
    activePlayer.removeEstablishment(giveCardName);
    otherPlayer.addEstablishment(giveCardName);
    otherPlayer.removeEstablishment(takeCardName);
    activePlayer.addEstablishment(takeCardName);

    return {
      success: true,
      message: `${activePlayer.name} swapped ${giveCardName} with ${otherPlayer.name} for ${takeCardName}`,
    };
  }
}
