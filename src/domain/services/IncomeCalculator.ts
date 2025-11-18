/**
 * Income Calculator Domain Service
 *
 * Calculates income for players based on dice rolls, owned cards, and landmarks.
 * This is a Domain Service because the logic spans multiple entities and value objects.
 */

import { Player } from '../entities/Player';
import { DiceRoll } from '../value-objects/DiceRoll';
import { Money } from '../value-objects/Money';
import { CardRegistry, EstablishmentCard } from '../value-objects/Card';

export class IncomeCalculator {
  /**
   * Calculate income for a player based on dice roll
   * Considers card activation numbers, multipliers, and landmark bonuses
   */
  static calculateIncome(player: Player, roll: DiceRoll): Money {
    let totalIncome = 0;

    const establishments = player.getEstablishmentCards();

    for (const card of establishments) {
      if (!card.activatesOn(roll.total)) {
        continue;
      }

      // Calculate base income
      let cardIncome = card.income;

      // Apply multipliers if any
      if (card.multiplier && Object.keys(card.multiplier).length > 0) {
        for (const [kind, multiplier] of Object.entries(card.multiplier)) {
          const count = player.getEstablishmentCountByKind(kind);
          cardIncome += count * multiplier;
        }
      }

      // Apply Shopping Center bonus for bread and coffee cards
      if (player.hasLandmark('Shopping Center')) {
        if (card.kind === 'bread' || card.kind === 'coffee') {
          cardIncome += 1;
        }
      }

      totalIncome += cardIncome;
    }

    return Money.of(totalIncome);
  }

  /**
   * Calculate income from red cards for a player on opponent's turn
   * Red cards give income from the bank when other players roll
   */
  static calculateRedCardIncome(
    player: Player,
    roll: DiceRoll
  ): Money {
    let totalIncome = 0;

    const establishments = player.getEstablishmentCards();

    for (const card of establishments) {
      if (!card.isHostileCard()) {
        continue;
      }

      if (!card.activatesOn(roll.total)) {
        continue;
      }

      // Calculate income from bank
      let cardIncome = card.income;

      // Apply Shopping Center bonus
      if (player.hasLandmark('Shopping Center')) {
        if (card.kind === 'bread' || card.kind === 'coffee') {
          cardIncome += 1;
        }
      }

      totalIncome += cardIncome;
    }

    return Money.of(totalIncome);
  }

  /**
   * Calculate total income from special ability cards (purple cards)
   * These require special handling based on the specific rule
   */
  static calculateSpecialAbilityIncome(
    player: Player,
    roll: DiceRoll,
    allPlayers: Player[]
  ): Money {
    let totalIncome = 0;

    const establishments = player.getEstablishmentCards();

    for (const card of establishments) {
      if (card.color !== 'purple') {
        continue;
      }

      if (!card.activatesOn(roll.total)) {
        continue;
      }

      // Handle special rules
      switch (card.specialRule) {
        case 'take_2_coins_from_every_player':
          // Stadium: Take 2 coins from each other player
          const otherPlayers = allPlayers.filter((p) => p.id !== player.id);
          for (const otherPlayer of otherPlayers) {
            const maxSteal = Math.min(2, otherPlayer.getMoney().getValue());
            totalIncome += maxSteal;
          }
          break;

        case 'take_5_coins_from_one_player':
          // TV Center: Take 5 coins from one player (will need to be handled by application layer)
          // For now, we'll calculate the potential income
          totalIncome += 5;
          break;

        case 'switch_1_non_tower_card_with_one_player':
          // Business Center: Switch cards (no income, handled by application layer)
          break;
      }
    }

    return Money.of(totalIncome);
  }

  /**
   * Get all players who should receive income on this roll (passive cards - blue)
   */
  static getPassiveIncomePlayers(allPlayers: Player[], roll: DiceRoll): Player[] {
    return allPlayers.filter((player) => {
      const cards = player.getEstablishmentCards();
      return cards.some((card) => card.isPassiveCard() && card.activatesOn(roll.total));
    });
  }

  /**
   * Get all players who should receive income from red cards (on opponent's turn)
   */
  static getRedCardPlayers(
    allPlayers: Player[],
    activePlayer: Player,
    roll: DiceRoll
  ): Player[] {
    return allPlayers
      .filter((player) => player.id !== activePlayer.id)
      .filter((player) => {
        const cards = player.getEstablishmentCards();
        return cards.some((card) => card.isHostileCard() && card.activatesOn(roll.total));
      });
  }
}
