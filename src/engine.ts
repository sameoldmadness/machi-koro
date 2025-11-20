/**
 * Game Engine
 *
 * Application layer orchestrator that runs the game loop.
 * Coordinates between domain entities and infrastructure (strategies, logging).
 */

import { Game } from "./domain/entities/Game";
import { Player } from "./domain/entities/Player";
import { DiceRoll } from "./domain/value-objects/DiceRoll";
import { EstablishmentName, LandmarkName } from "./domain/value-objects/Card";
import { IncomeCalculator } from "./domain/services/IncomeCalculator";
import { PurchaseService } from "./domain/services/PurchaseService";
import { SpecialAbilityService } from "./domain/services/SpecialAbilityService";
import { CardSwapService } from "./domain/services/CardSwapService";
import logger from "./infrastructure/logging/logger";

/**
 * Strategy interface for AI decision making
 * This is an infrastructure concern, not domain logic
 */
export interface GameStrategy {
    roll: (game: Game) => Promise<number>;
    reroll: (previousRoll: number, game: Game) => Promise<number | null>;
    buy: (game: Game) => Promise<EstablishmentName | LandmarkName | null>;
    swap: (game: Game) => Promise<{ give: EstablishmentName; take: EstablishmentName; otherPlayerIndex: number } | null>;
}

/**
 * Registry to associate players with their strategies
 */
class StrategyRegistry {
    private strategies: Map<string, GameStrategy> = new Map();

    register(playerId: string, strategy: GameStrategy): void {
        this.strategies.set(playerId, strategy);
    }

    get(playerId: string): GameStrategy | undefined {
        return this.strategies.get(playerId);
    }
}

const strategyRegistry = new StrategyRegistry();

/**
 * Helper to roll dice
 */
function rollDice(numDice: number): { total: number; rolls: number[] } {
    const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * 6) + 1);
    const total = rolls.reduce((sum, roll) => sum + roll, 0);
    return { total, rolls };
}

/**
 * Shuffle array in place (Fisher-Yates algorithm)
 */
function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Process income for all players based on dice roll
 */
function processIncome(game: Game, diceRoll: DiceRoll): void {
    const players = game.getPlayers();
    const activePlayerIndex = game.getCurrentPlayerIndex();

    // Process active player
    const activePlayer = players[activePlayerIndex];
    const activeIncome = IncomeCalculator.calculateIncome(activePlayer, diceRoll);
    if (activeIncome.getValue() > 0) {
        activePlayer.addMoney(activeIncome);
        logger.debug(`${activePlayer.name} earned ${activeIncome.getValue()} coins from active player cards`);
    }

    // Process other players (passive + red cards)
    for (let i = 0; i < players.length; i++) {
        if (i === activePlayerIndex) continue;

        const player = players[i];
        const passiveIncome = IncomeCalculator.calculatePassiveIncome(player, diceRoll);
        const redCardIncome = IncomeCalculator.calculateRedCardIncome(player, diceRoll);

        const totalIncome = passiveIncome.getValue() + redCardIncome.getValue();
        if (totalIncome > 0) {
            player.addMoney(passiveIncome);
            player.addMoney(redCardIncome);
            logger.debug(`${player.name} earned ${totalIncome} coins from passive/red cards`);
        }
    }
}

/**
 * Process special abilities (purple cards) for active player
 */
async function processSpecialAbilities(game: Game, diceRoll: DiceRoll): Promise<void> {
    const activePlayer = game.getCurrentPlayer();
    const purpleCards = activePlayer.getEstablishmentCards().filter(
        card => card.color === 'purple' && card.activatesOn(diceRoll.total)
    );

    for (const purpleCard of purpleCards) {
        if (!purpleCard.specialRule) continue;

        switch (purpleCard.specialRule) {
            case 'take_2_coins_from_every_player':
            case 'take_5_coins_from_one_player':
                // Stadium or TV Center
                const otherPlayers = game.getOtherPlayers();
                const result = SpecialAbilityService.executeSpecialAbility(
                    purpleCard,
                    activePlayer,
                    otherPlayers
                );
                logger.info(`${activePlayer.name} ${result.description}`);
                break;

            case 'switch_1_non_tower_card_with_one_player':
                // Business Center - need strategy decision
                const strategy = strategyRegistry.get(activePlayer.id);
                if (!strategy) break;

                const swapDecision = await strategy.swap(game);
                if (swapDecision === null) {
                    logger.info(`${activePlayer.name} decided not to swap cards`);
                    break;
                }

                const { give, take, otherPlayerIndex } = swapDecision;
                const otherPlayer = game.getPlayers()[otherPlayerIndex];

                const swapResult = CardSwapService.swapCards(
                    activePlayer,
                    otherPlayer,
                    give,
                    take
                );

                if (swapResult.success) {
                    logger.info(swapResult.message);
                } else {
                    logger.warn(swapResult.message);
                }
                break;
        }
    }
}

/**
 * Execute a player's turn
 */
async function executeTurn(game: Game, maxSteps: number, currentStep: number): Promise<boolean> {
    const player = game.getCurrentPlayer();
    const strategy = strategyRegistry.get(player.id);

    if (!strategy) {
        logger.error(`No strategy found for player ${player.name}`);
        return false;
    }

    logger.info(`Step number ${currentStep}`);
    logger.info(`Active player: ${player.name}`);
    logger.debug(`${player.name}'s budget: ${player.getMoney().getValue()} coins`);

    // Decide number of dice to roll
    const canRollTwo = player.hasLandmark('Terminal');
    let numDice = await strategy.roll(game);
    if (!canRollTwo && numDice > 1) {
        numDice = 1; // Force single die if no Terminal
    }

    logger.info(`Player decides to roll ${numDice} dice(s)`);

    // Roll dice
    let { total, rolls } = rollDice(numDice);
    logger.info(`Player rolled ${total}` + (numDice > 1 ? ` (${rolls.join('+')})` : ''));

    // Reroll if Radio Tower is built
    if (player.hasLandmark('Radio Tower')) {
        logger.debug(`${player.name} has Radio Tower - checking for reroll`);
        const rerollDice = await strategy.reroll(total, game);
        if (rerollDice) {
            const reroll = rollDice(rerollDice);
            total = reroll.total;
            rolls = reroll.rolls;
            logger.info(`Player rerolled ${total}` + (rerollDice > 1 ? ` (${rolls.join('+')})` : ''));
        } else {
            logger.info(`Player decides not to reroll`);
        }
    }

    // Process income for all players
    const diceRoll = DiceRoll.of(rolls.slice(0, numDice));
    processIncome(game, diceRoll);

    // Process special abilities
    await processSpecialAbilities(game, diceRoll);

    // Check for doubles with Amusement Park
    if (rolls[0] === rolls[1] && numDice === 2 && player.hasLandmark('Amusement Park')) {
        logger.info(`Player rolled doubles and gets to roll again`);
        const bonusRoll = rollDice(numDice);
        logger.info(`Player rolled ${bonusRoll.total} (${bonusRoll.rolls.join('+')})`);
        const bonusDiceRoll = DiceRoll.of(bonusRoll.rolls);
        processIncome(game, bonusDiceRoll);
        await processSpecialAbilities(game, bonusDiceRoll);
    }

    logger.info(`Player has ${player.getMoney().getValue()} coins`);

    // Purchase phase
    const purchase = await strategy.buy(game);
    if (purchase) {
        logger.info(`Player decides to buy ${purchase}`);
        const result = PurchaseService.purchase(player, purchase, game.getMarketDeck());
        if (result.success) {
            logger.debug(result.message);
        } else {
            logger.warn(result.message);
        }
    } else {
        logger.info(`Player decides to skip`);
    }

    // Check win condition
    if (player.hasWon()) {
        logger.info(`🎉 Player ${player.name} has won the game!`);
        const finalScores = game.getPlayers()
            .map(p => `${p.name}: ${p.getMoney().getValue()} coins`)
            .join(', ');
        logger.debug(`Final scores: ${finalScores}`);
        return true; // Game over
    }

    return false; // Continue
}

/**
 * Run a complete game
 */
export async function runGame(game: Game, maxSteps: number = 1000): Promise<void> {
    logger.debug(`Starting game run with max ${maxSteps} steps`);
    game.start();

    for (let i = 0; i < maxSteps; i++) {
        const gameOver = await executeTurn(game, maxSteps, i);
        if (gameOver) break;

        game.endTurn();
    }
}

/**
 * Initialize and run a new game with default strategies
 */
export async function initGame(): Promise<void> {
    logger.info('=== Starting new game ===');

    // Create players
    const playerNames = ['A', 'B', 'C'];
    shuffle(playerNames);

    const game = Game.create('game-1', playerNames);
    const players = game.getPlayers();

    logger.info(`Player order: ${players.map(p => p.name).join(' → ')}`);

    // Import strategies dynamically to avoid circular dependency
    const { cogStrategy, grainStrategy, shopStrategy } = await import('./domain/strategies/Strategy');

    // Register strategies for each player
    const strategies = [cogStrategy, grainStrategy, shopStrategy];
    for (let i = 0; i < players.length; i++) {
        strategyRegistry.register(players[i].id, strategies[i]);
        logger.debug(`Players: ${players[i].name} (${['cogStrategy', 'grainStrategy', 'shopStrategy'][i]})`);
    }

    await runGame(game, 100);
}

/**
 * Export strategy registry for testing
 */
export { strategyRegistry };
