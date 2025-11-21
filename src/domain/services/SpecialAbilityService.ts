/**
 * SpecialAbility Domain Service
 *
 * Handles purple card special abilities (Stadium, TV Center, Business Center)
 * This is a Domain Service because special abilities involve complex interactions
 * between multiple players and cards.
 */

import { Player } from '../entities/Player';
import { Money } from '../value-objects/Money';
import { EstablishmentCard } from '../value-objects/Card';

/**
 * Result of a special ability execution
 */
export interface SpecialAbilityResult {
  /**
   * Amount of money gained by the active player
   */
  moneyGained: Money;

  /**
   * Description of what happened
   */
  description: string;
}

/**
 * Stadium special ability
 * Takes 2 coins from each other player
 */
export function executeStadium(
  activePlayer: Player,
  otherPlayers: Player[]
): SpecialAbilityResult {
  let totalGained = 0;

  for (const otherPlayer of otherPlayers) {
    const payment = Math.min(2, otherPlayer.getMoney().getValue());
    if (payment > 0) {
      otherPlayer.removeMoney(Money.of(payment));
      totalGained += payment;
    }
  }

  const moneyGained = Money.of(totalGained);
  activePlayer.addMoney(moneyGained);

  return {
    moneyGained,
    description: `Took ${totalGained} coins from other players (Stadium)`,
  };
}

/**
 * TV Center special ability
 * Takes 5 coins from richest player
 */
export function executeTVCenter(
  activePlayer: Player,
  otherPlayers: Player[]
): SpecialAbilityResult {
  if (otherPlayers.length === 0) {
    return {
      moneyGained: Money.of(0),
      description: 'No other players to take coins from (TV Center)',
    };
  }

  // Find richest player
  const richestPlayer = otherPlayers.reduce((richest, player) =>
    player.getMoney().isGreaterThan(richest.getMoney()) ? player : richest
  );

  const payment = Math.min(5, richestPlayer.getMoney().getValue());
  const moneyGained = Money.of(payment);

  if (payment > 0) {
    richestPlayer.removeMoney(moneyGained);
    activePlayer.addMoney(moneyGained);
  }

  return {
    moneyGained,
    description: `Took ${payment} coins from ${richestPlayer.name} (TV Center)`,
  };
}

/**
 * Business Center special ability
 * Swaps a card with another player
 * Note: This requires strategy input, so it returns a flag indicating that
 */
export function getBusinessCenterRequiresInput(): SpecialAbilityResult {
  return {
    moneyGained: Money.of(0),
    description: 'Business Center swap requires strategy input',
  };
}

export class SpecialAbilityService {
  /**
   * Execute a special ability for a purple card
   * Returns the result of the ability execution
   */
  static executeSpecialAbility(
    card: EstablishmentCard,
    activePlayer: Player,
    otherPlayers: Player[]
  ): SpecialAbilityResult {
    if (!card.specialRule) {
      return {
        moneyGained: Money.of(0),
        description: 'No special ability',
      };
    }

    switch (card.specialRule) {
      case 'take_2_coins_from_every_player':
        return executeStadium(activePlayer, otherPlayers);

      case 'take_5_coins_from_one_player':
        return executeTVCenter(activePlayer, otherPlayers);

      case 'switch_1_non_tower_card_with_one_player':
        return getBusinessCenterRequiresInput();

      default:
        return {
          moneyGained: Money.of(0),
          description: `Unknown special ability: ${card.specialRule}`,
        };
    }
  }
}
