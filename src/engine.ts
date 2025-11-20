import { Player, State } from "./game";
import { cogStrategy, grainStrategy, shopStrategy } from "./domain/strategies/Strategy";
import { buy, createGame, createPlayer, getPlayersToProcess, playerHasWon, roll, shuffle } from "./utils";
import logger from "./infrastructure/logging/logger";
import { DiceRoll } from "./domain/value-objects/DiceRoll";
import { IncomeCalculator } from "./domain/services/IncomeCalculator";
import { SpecialAbilityService } from "./domain/services/SpecialAbilityService";
import { CardSwapService } from "./domain/services/CardSwapService";
import { convertToDomainPlayer, convertFromDomainPlayer } from "./adapters/GameAdapter";

export async function initGame() {
    logger.info('=== Starting new game ===');
    const playerA = createPlayer('A', cogStrategy);
    const playerB = createPlayer('B', grainStrategy);
    const playerC = createPlayer('C', shopStrategy);

    logger.debug(`Players: ${playerA.name} (cogStrategy), ${playerB.name} (grainStrategy), ${playerC.name} (shopStrategy)`);

    const game = createGame(shuffle([playerA, playerB, playerC]));
    logger.info(`Player order: ${game.players.map(p => p.name).join(' → ')}`);

    await runGame(game, 100);
}

export async function runGame(game: State, maxSteps: number = 1000) {
    logger.debug(`Starting game run with max ${maxSteps} steps`);

    for (let i = 0; i < maxSteps; i += 1) {
        logger.info(`Step number ${i}`);
        game.activePlayerIndex += 1;
        game.activePlayerIndex %= game.players.length;
        let player = game.players[game.activePlayerIndex];
        logger.info(`Active player: ${player.name}`);
        logger.debug(`${player.name}'s budget: ${player.budget} coins`);

        let nDice = await player.strategy.roll(game);
        logger.info(`Player decides to roll ${nDice} dice(s)`);
        let [res, rolls] = roll(nDice);
        logger.info(`Player rolled ${res}` + (nDice > 1 ? ` (${rolls.join('+')})` : ''));

        // TODO connect ths with reroll strategy and amusement cards
        if (player.amusementDeck['Radio Tower']) {
            logger.debug(`${player.name} has Radio Tower - checking for reroll`);
            let nDice = await player.strategy.reroll(res, game);
            if (nDice) {
                [res, rolls] = roll(nDice);
                logger.info(`Player rerolled ${res}` + (nDice > 1 ? ` (${rolls.join('+')})` : ''));
            } else {
                logger.info(`Player decides not to reroll`);
            }
        }
        // Create DiceRoll value object for domain logic
        const diceRoll = DiceRoll.of(rolls.slice(0, nDice));
        await process(diceRoll, game);
        if (rolls[0] === rolls[1] && player.amusementDeck['Amusement Park']) {
            logger.info(`Player rolled double and gets to roll again`);
            let [res2, rolls2] = roll(nDice);
            logger.info(`Player rolled ${res2}` + (nDice > 1 ? ` (${rolls2.join('+')})` : ''));
            const diceRoll2 = DiceRoll.of(rolls2.slice(0, nDice));
            process(diceRoll2, game);
            // TODO allow to reroll here if not rerolled before
        }
        logger.info(`Player has ${player.budget} coins`);
        let purchase = await player.strategy.buy(game);
        if (purchase) {
            logger.info(`Player decides to buy ${purchase}`);
            buy(purchase, player, game);
        } else {
            logger.info(`Player decides to skip`);
        }
        if (playerHasWon(player)) {
            logger.info(`🎉 Player ${player.name} has won the game!`);
            logger.debug(`Final scores: ${game.players.map(p => `${p.name}: ${p.budget} coins`).join(', ')}`);
            break;
        }
    }
}

async function process(diceRoll: DiceRoll, game: State) {
    const playersToProcess = getPlayersToProcess(game.activePlayerIndex, game.players);

    for (const [index, player] of playersToProcess.entries()) {
        const isActivePlayer = index === 0; // The first player in the reordered list is the active player
        await processPlayer(diceRoll, player, isActivePlayer, game);
    }
}

async function processPlayer(diceRoll: DiceRoll, player: Player, isActivePlayer: boolean, game: State) {
    // Convert to domain player for income calculation
    const domainPlayer = convertToDomainPlayer(player);
    const activePlayer = game.players[game.activePlayerIndex];
    const domainActivePlayer = convertToDomainPlayer(activePlayer);

    // Use IncomeCalculator for income logic
    if (isActivePlayer) {
        // Active player gets income from green and blue cards
        const income = IncomeCalculator.calculateIncome(domainPlayer, diceRoll);
        if (income.getValue() > 0) {
            player.budget += income.getValue();
            logger.debug(`${player.name} earned ${income.getValue()} coins from active player cards`);
        }
    } else {
        // Non-active players get income from blue cards (passive) and red cards
        const passiveIncome = IncomeCalculator.calculatePassiveIncome(domainPlayer, diceRoll);
        if (passiveIncome.getValue() > 0) {
            player.budget += passiveIncome.getValue();
            logger.debug(`${player.name} earned ${passiveIncome.getValue()} coins from passive cards`);
        }

        const redCardIncome = IncomeCalculator.calculateRedCardIncome(domainPlayer, diceRoll);
        if (redCardIncome.getValue() > 0) {
            player.budget += redCardIncome.getValue();
            logger.debug(`${player.name} earned ${redCardIncome.getValue()} coins from red cards (from bank)`);
        }
    }

    // Handle special abilities (purple cards) - only for active player
    if (isActivePlayer) {
        const purpleCards = domainPlayer.getEstablishmentCards().filter(
            card => card.color === 'purple' && card.activatesOn(diceRoll.total)
        );

        for (const purpleCard of purpleCards) {
            if (!purpleCard.specialRule) continue;

            switch (purpleCard.specialRule) {
                case 'take_2_coins_from_every_player':
                case 'take_5_coins_from_one_player':
                    // Stadium or TV Center: Use SpecialAbilityService
                    const otherPlayers = game.players.filter(p => p !== player);
                    const otherDomainPlayers = otherPlayers.map(p => convertToDomainPlayer(p));

                    const result = SpecialAbilityService.executeSpecialAbility(
                        purpleCard,
                        domainPlayer,
                        otherDomainPlayers
                    );

                    // Sync domain changes back to old state
                    player.budget = domainPlayer.getMoney().getValue();
                    for (let i = 0; i < otherPlayers.length; i++) {
                        otherPlayers[i].budget = otherDomainPlayers[i].getMoney().getValue();
                    }

                    logger.info(`${player.name} ${result.description}`);
                    break;

                case 'switch_1_non_tower_card_with_one_player':
                    // Business Center: Swap a card with another player
                    const swapDecision = await player.strategy.swap(game);
                    if (swapDecision === null) {
                        logger.info(`${player.name} decided not to swap cards`);
                        break;
                    }

                    const { give, take, otherPlayerIndex } = swapDecision;
                    const otherPlayer = game.players[otherPlayerIndex!];

                    // Use CardSwapService for validation and execution
                    const otherDomainPlayer = convertToDomainPlayer(otherPlayer);
                    const swapResult = CardSwapService.swapCards(
                        domainPlayer,
                        otherDomainPlayer,
                        give,
                        take
                    );

                    if (!swapResult.success) {
                        logger.warn(`${swapResult.message}`);
                        break;
                    }

                    // Sync domain changes back to old state
                    convertFromDomainPlayer(domainPlayer, player);
                    convertFromDomainPlayer(otherDomainPlayer, otherPlayer);

                    logger.info(swapResult.message);
                    break;
            }
        }
    }
}