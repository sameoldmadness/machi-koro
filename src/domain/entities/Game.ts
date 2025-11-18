/**
 * Game Aggregate Root
 *
 * The main aggregate that encapsulates the entire game state and coordinates all entities.
 * Enforces game rules and ensures consistency across the aggregate.
 */

import { Player } from './Player';
import { MarketDeck } from './MarketDeck';
import { DiceRoll } from '../value-objects/DiceRoll';

export type GameStatus = 'waiting' | 'in_progress' | 'finished';

/**
 * Game aggregate root managing all game state and entities
 */
export class Game {
  private readonly players: Player[];
  private readonly marketDeck: MarketDeck;
  private currentPlayerIndex: number;
  private status: GameStatus;
  private winner: Player | null;
  private lastDiceRoll: DiceRoll | null;

  private constructor(
    public readonly id: string,
    players: Player[],
    marketDeck: MarketDeck,
    currentPlayerIndex: number,
    status: GameStatus,
    winner: Player | null = null,
    lastDiceRoll: DiceRoll | null = null
  ) {
    if (players.length < 2 || players.length > 4) {
      throw new Error('Game requires 2-4 players');
    }

    this.players = [...players]; // Defensive copy
    this.marketDeck = marketDeck;
    this.currentPlayerIndex = currentPlayerIndex;
    this.status = status;
    this.winner = winner;
    this.lastDiceRoll = lastDiceRoll;
  }

  /**
   * Create a new game with players
   */
  static create(id: string, playerNames: string[]): Game {
    if (playerNames.length < 2 || playerNames.length > 4) {
      throw new Error('Game requires 2-4 players');
    }

    const players = playerNames.map((name, index) => {
      return Player.create(`player-${index + 1}`, name);
    });

    const marketDeck = MarketDeck.create('market-1');

    return new Game(id, players, marketDeck, 0, 'waiting');
  }

  /**
   * Create game with custom state (for testing or loading)
   */
  static createWithState(
    id: string,
    players: Player[],
    marketDeck: MarketDeck,
    currentPlayerIndex: number,
    status: GameStatus,
    winner: Player | null = null,
    lastDiceRoll: DiceRoll | null = null
  ): Game {
    return new Game(id, players, marketDeck, currentPlayerIndex, status, winner, lastDiceRoll);
  }

  // ==================== Game Flow ====================

  /**
   * Start the game
   */
  start(): void {
    if (this.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    this.status = 'in_progress';
  }

  /**
   * Check if game is started
   */
  isStarted(): boolean {
    return this.status === 'in_progress' || this.status === 'finished';
  }

  /**
   * Check if game is finished
   */
  isFinished(): boolean {
    return this.status === 'finished';
  }

  /**
   * End the current player's turn and move to next player
   */
  endTurn(): void {
    if (this.status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }

    // Check for winner
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.hasWon()) {
      this.winner = currentPlayer;
      this.status = 'finished';
      return;
    }

    // Move to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  /**
   * Record a dice roll
   */
  recordDiceRoll(roll: DiceRoll): void {
    this.lastDiceRoll = roll;
  }

  /**
   * Get last dice roll
   */
  getLastDiceRoll(): DiceRoll | null {
    return this.lastDiceRoll;
  }

  // ==================== Player Access ====================

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    if (this.status === 'waiting') {
      throw new Error('Game has not started yet');
    }
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get player by ID
   */
  getPlayerById(playerId: string): Player | undefined {
    return this.players.find((p) => p.id === playerId);
  }

  /**
   * Get player by name
   */
  getPlayerByName(name: string): Player | undefined {
    return this.players.find((p) => p.name === name);
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return [...this.players]; // Defensive copy
  }

  /**
   * Get number of players
   */
  getPlayerCount(): number {
    return this.players.length;
  }

  /**
   * Get current player index
   */
  getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  /**
   * Get all players except current player
   */
  getOtherPlayers(): Player[] {
    if (this.status === 'waiting') {
      return [...this.players];
    }
    return this.players.filter((_, index) => index !== this.currentPlayerIndex);
  }

  // ==================== Market Access ====================

  /**
   * Get market deck
   */
  getMarketDeck(): MarketDeck {
    return this.marketDeck;
  }

  // ==================== Game State ====================

  /**
   * Get game status
   */
  getStatus(): GameStatus {
    return this.status;
  }

  /**
   * Get winner (null if game not finished)
   */
  getWinner(): Player | null {
    return this.winner;
  }

  /**
   * Check if a specific player has won
   */
  hasWinner(): boolean {
    return this.winner !== null;
  }

  // ==================== Serialization ====================

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      players: this.players.map((p) => p.toJSON()),
      marketDeck: this.marketDeck.toJSON(),
      currentPlayerIndex: this.currentPlayerIndex,
      status: this.status,
      winner: this.winner ? this.winner.id : null,
      lastDiceRoll: this.lastDiceRoll ? this.lastDiceRoll.toJSON() : null,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: {
    id: string;
    players: any[];
    marketDeck: any;
    currentPlayerIndex: number;
    status: GameStatus;
    winner: string | null;
    lastDiceRoll: any;
  }): Game {
    const players = data.players.map((p) => Player.fromJSON(p));
    const marketDeck = MarketDeck.fromJSON(data.marketDeck);

    let winner: Player | null = null;
    if (data.winner) {
      winner = players.find((p) => p.id === data.winner) || null;
    }

    const lastDiceRoll = data.lastDiceRoll ? DiceRoll.fromJSON(data.lastDiceRoll) : null;

    return new Game(
      data.id,
      players,
      marketDeck,
      data.currentPlayerIndex,
      data.status,
      winner,
      lastDiceRoll
    );
  }
}
