/**
 * Income Calculator Domain Service
 *
 * Calculates income for players based on dice rolls, owned cards, and landmarks.
 * This is a Domain Service because the logic spans multiple entities and value objects.
 */

import { Player } from '../entities/Player';
import { DiceRoll } from '../value-objects/DiceRoll';
import { Money } from '../value-objects/Money';
import { EstablishmentCard, CardColor } from '../value-objects/Card';

export class IncomeCalculator {
  static calculateIncome(color: CardColor, player: Player, roll: DiceRoll, allPlayers: Player[] = []): Money {
    let totalIncome = 0;

    const establishments = player.getEstablishmentCards();

    for (const card of establishments) {
      if (card.color !== color) {
        continue;
      }

      if (!card.activatesOn(roll.total)) {
        continue;
      }

      const cardIncome = this.calculateOneCardIncome(card, player, allPlayers);
      totalIncome += cardIncome.getValue();
    }

    return Money.of(totalIncome);
  }

  static calculateOneCardIncome(card: EstablishmentCard, player: Player, allPlayers: Player[]): Money {
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

    switch (card.specialRule) {
      case 'take_2_coins_from_every_player':
        // Stadium: Take 2 coins from each other player
        const otherPlayers = allPlayers.filter((p) => p.id !== player.id);
        for (const otherPlayer of otherPlayers) {
          const maxSteal = Math.min(2, otherPlayer.getMoney().getValue());
          cardIncome += maxSteal;
        }
        break;

      case 'take_5_coins_from_one_player':
        // TV Center: Take 5 coins from one player (will need to be handled by application layer)
        // For now, we'll calculate the potential income
        cardIncome += 5;
        break;

      case 'switch_1_non_tower_card_with_one_player':
        // Business Center: Switch cards (no income, handled by application layer)
        break;
    }

    return Money.of(cardIncome);
  }
}
