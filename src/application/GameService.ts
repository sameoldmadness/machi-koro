/**
 * GameService - Application Service
 *
 * Coordinates domain services to implement use cases.
 * This layer orchestrates domain logic without containing business rules itself.
 */

import { Game } from '../domain/entities/Game';
import { Player } from '../domain/entities/Player';
import { MarketDeck } from '../domain/entities/MarketDeck';
import { DiceRoll } from '../domain/value-objects/DiceRoll';
import { Money } from '../domain/value-objects/Money';
import { IncomeCalculator } from '../domain/services/IncomeCalculator';
import { PurchaseService } from '../domain/services/PurchaseService';
import { SpecialAbilityService } from '../domain/services/SpecialAbilityService';
import { CardSwapService } from '../domain/services/CardSwapService';
import { EstablishmentName, LandmarkName } from '../domain/value-objects/Card';

/**
 * Create a new game with the specified players
 */
export function createGame(playerNames: string[], gameId: string = 'game-1'): Game {
  return Game.create(gameId, playerNames);
}

/**
 * Process income for all players based on dice roll
 */
export function processIncome(game: Game, diceRoll: DiceRoll): void {
  const activePlayerIndex = game.getCurrentPlayerIndex();
  const players = game.getPlayers();

  // Process active player first
  const activePlayer = players[activePlayerIndex];
  const activeIncome = IncomeCalculator.calculateIncome(activePlayer, diceRoll);

  if (activeIncome.getValue() > 0) {
    activePlayer.addMoney(activeIncome);
  }

  // Process other players (passive income + red cards)
  for (let i = 0; i < players.length; i++) {
    if (i === activePlayerIndex) continue;

    const player = players[i];
    const passiveIncome = IncomeCalculator.calculatePassiveIncome(player, diceRoll);
    const redCardIncome = IncomeCalculator.calculateRedCardIncome(player, diceRoll);

    const totalIncome = Money.of(passiveIncome.getValue() + redCardIncome.getValue());
    if (totalIncome.getValue() > 0) {
      player.addMoney(totalIncome);
    }
  }
}

/**
 * Execute a card purchase for the current player
 */
export function executePurchase(
  game: Game,
  cardName: EstablishmentName | LandmarkName
): { success: boolean; message: string } {
  const activePlayer = game.getCurrentPlayer();
  const marketDeck = game.getMarketDeck();

  return PurchaseService.purchase(activePlayer, cardName, marketDeck);
}

/**
 * Execute special ability for a purple card
 */
export function executeSpecialAbility(
  game: Game,
  purpleCardName: EstablishmentName,
  targetPlayerIndex?: number
): { success: boolean; message: string } {
  const activePlayerIndex = game.getCurrentPlayerIndex();
  const players = game.getPlayers();
  const activePlayer = players[activePlayerIndex];

  const purpleCard = activePlayer.getEstablishmentCards().find(
    card => card.name === purpleCardName && card.color === 'purple'
  );

  if (!purpleCard || !purpleCard.specialRule) {
    return { success: false, message: `${purpleCardName} is not a valid purple card` };
  }

  const otherPlayers = players.filter((_, i) => i !== activePlayerIndex);

  try {
    const result = SpecialAbilityService.executeSpecialAbility(
      purpleCard,
      activePlayer,
      otherPlayers
    );
    return { success: true, message: result.description };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Execute a card swap (Business Center)
 */
export function executeCardSwap(
  game: Game,
  giveCard: EstablishmentName,
  takeCard: EstablishmentName,
  otherPlayerIndex: number
): { success: boolean; message: string } {
  const activePlayerIndex = game.getCurrentPlayerIndex();
  const players = game.getPlayers();
  const activePlayer = players[activePlayerIndex];
  const otherPlayer = players[otherPlayerIndex];

  const result = CardSwapService.swapCards(
    activePlayer,
    otherPlayer,
    giveCard,
    takeCard
  );

  return result;
}

/**
 * Check if the current player has won
 */
export function checkWinCondition(game: Game): boolean {
  const activePlayer = game.getPlayers()[game.getCurrentPlayerIndex()];
  return activePlayer.hasWon();
}

/**
 * Advance to the next player's turn
 */
export function nextTurn(game: Game): void {
  game.endTurn();
}
