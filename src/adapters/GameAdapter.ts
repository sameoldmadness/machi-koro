/**
 * GameAdapter
 *
 * Adapter layer to convert between old procedural game state and new DDD domain model.
 * This allows gradual migration from old code to DDD architecture.
 */

import { Player as OldPlayer, State as OldState, Name } from '../game';
import { Player as DomainPlayer } from '../domain/entities/Player';
import { Game as DomainGame } from '../domain/entities/Game';
import { MarketDeck } from '../domain/entities/MarketDeck';
import { Money } from '../domain/value-objects/Money';
import { EstablishmentName, LandmarkName } from '../domain/value-objects/Card';

/**
 * Convert old Player to DDD Player entity
 */
export function convertToDomainPlayer(oldPlayer: OldPlayer): DomainPlayer {
  // Convert budget to Money value object
  const money = Money.of(oldPlayer.budget);

  // Convert deck (Record<Name, number>) to establishments Map
  const establishments = new Map<EstablishmentName, number>();
  for (const [cardName, count] of Object.entries(oldPlayer.deck)) {
    if (count > 0) {
      establishments.set(cardName as EstablishmentName, count);
    }
  }

  // Convert amusement deck to landmarks Set
  const landmarks = new Set<LandmarkName>();
  for (const [landmarkName, isBuilt] of Object.entries(oldPlayer.amusementDeck)) {
    if (isBuilt) {
      landmarks.add(landmarkName as LandmarkName);
    }
  }

  return DomainPlayer.createWithState(
    oldPlayer.name, // Use name as ID for now
    oldPlayer.name,
    money,
    establishments,
    landmarks
  );
}

/**
 * Convert DDD Player entity back to old Player
 */
export function convertFromDomainPlayer(domainPlayer: DomainPlayer, oldPlayer: OldPlayer): void {
  // Update budget
  oldPlayer.budget = domainPlayer.getMoney().getValue();

  // Update deck
  oldPlayer.deck = {};
  const establishments = domainPlayer.getEstablishments();
  for (const [cardName, count] of establishments.entries()) {
    oldPlayer.deck[cardName as Name] = count;
  }

  // Update amusement deck
  oldPlayer.amusementDeck = {
    'Terminal': false,
    'Shopping Center': false,
    'Amusement Park': false,
    'Radio Tower': false,
  };
  const landmarks = domainPlayer.getLandmarks();
  for (const landmarkName of landmarks) {
    oldPlayer.amusementDeck[landmarkName] = true;
  }
}

/**
 * Convert old State to DDD Game aggregate
 */
export function convertToDomainGame(oldState: OldState, gameId: string = 'game-1'): DomainGame {
  // Convert all players
  const domainPlayers = oldState.players.map(convertToDomainPlayer);

  // Create market deck (simplified - using defaults for now)
  const marketDeck = MarketDeck.create('market-1');

  // Create game with current state
  const game = DomainGame.createWithState(
    gameId,
    domainPlayers,
    marketDeck,
    oldState.activePlayerIndex,
    'in_progress', // Assume game is in progress
    null, // No winner yet
    null  // No last dice roll
  );

  return game;
}

/**
 * Sync DDD Game state back to old State
 */
export function syncToOldState(domainGame: DomainGame, oldState: OldState): void {
  // Update active player index
  oldState.activePlayerIndex = domainGame.getCurrentPlayerIndex();

  // Sync all players
  const domainPlayers = domainGame.getPlayers();
  for (let i = 0; i < oldState.players.length; i++) {
    if (domainPlayers[i]) {
      convertFromDomainPlayer(domainPlayers[i], oldState.players[i]);
    }
  }
}
