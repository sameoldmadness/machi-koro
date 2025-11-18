import { cards, Player, State } from "./game";
import { cogStrategy, grainStrategy, shopStrategy } from "./strategy";
import { buy, createGame, createPlayer, getPlayersToProcess, playerHasWon, roll, shuffle } from "./utils";
import logger from "./logger";
import { DiceRoll } from "./domain/value-objects/DiceRoll";
import { IncomeCalculator } from "./domain/services/IncomeCalculator";
import { convertToDomainPlayer } from "./adapters/GameAdapter";

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
        await process(res, diceRoll, game);
        if (rolls[0] === rolls[1] && player.amusementDeck['Amusement Park']) {
            logger.info(`Player rolled double and gets to roll again`);
            let [res2, rolls2] = roll(nDice);
            logger.info(`Player rolled ${res2}` + (nDice > 1 ? ` (${rolls2.join('+')})` : ''));
            const diceRoll2 = DiceRoll.of(rolls2.slice(0, nDice));
            process(res2, diceRoll2, game);
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

async function process(res: number, diceRoll: DiceRoll, game: State) {
    const playersToProcess = getPlayersToProcess(game.activePlayerIndex, game.players);

    for (const [index, player] of playersToProcess.entries()) {
        const isActivePlayer = index === 0; // The first player in the reordered list is the active player
        await processPlayer(res, diceRoll, player, isActivePlayer, game);
    }
}

async function processPlayer(res: number, diceRoll: DiceRoll, player: Player, isActivePlayer: boolean, game: State) {
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
        // Non-active players only get income from blue cards (passive)
        // calculateIncome() includes green cards too, so we need to manually calculate blue only
        let passiveIncome = 0;
        const cards = domainPlayer.getEstablishmentCards();
        for (const card of cards) {
            if (card.isPassiveCard() && card.activatesOn(diceRoll.total)) {
                let cardIncome = card.income;

                // Apply multipliers if any
                if (card.multiplier && Object.keys(card.multiplier).length > 0) {
                    for (const [kind, multiplier] of Object.entries(card.multiplier)) {
                        const count = domainPlayer.getEstablishmentCountByKind(kind);
                        cardIncome += count * multiplier;
                    }
                }

                // Apply Shopping Center bonus for bread and coffee cards
                if (domainPlayer.hasLandmark('Shopping Center')) {
                    if (card.kind === 'bread' || card.kind === 'coffee') {
                        cardIncome += 1;
                    }
                }

                passiveIncome += cardIncome;
            }
        }

        if (passiveIncome > 0) {
            player.budget += passiveIncome;
            logger.debug(`${player.name} earned ${passiveIncome} coins from passive cards`);
        }

        // Non-active players can steal from active player (red cards)
        const hostileIncome = IncomeCalculator.calculateHostileIncome(domainPlayer, domainActivePlayer, diceRoll);
        if (hostileIncome.getValue() > 0) {
            const stolen = Math.min(hostileIncome.getValue(), activePlayer.budget);
            activePlayer.budget -= stolen;
            player.budget += stolen;
            logger.debug(`${player.name} stole ${stolen} coins from ${activePlayer.name} (red cards)`);
        }
    }

    // Handle special rules (purple cards) - keep original logic for now
    for (const [cardName, count] of Object.entries(player.deck)) {
        const card = cards.find(v => v.name === cardName)!;

        const isGreenOrPurple = (card.color === 'green' || card.color === 'purple') && isActivePlayer;

        if (card.match.includes(res) && isGreenOrPurple) {
            if (card.specialRule) {
                switch (card.specialRule) {
                    case 'take_2_coins_from_every_player':
                        // each other player gives 2 coins to this player
                        // find all players that are not the current player
                        let nonActivePlayers = game.players.filter(p => p !== player);
                        let totalTaken = 0;
                        for (const otherPlayer of nonActivePlayers) {
                            let payment = Math.min(2, otherPlayer.budget);
                            otherPlayer.budget -= payment;
                            player.budget += payment;
                            totalTaken += payment;
                        }
                        logger.info(`Player ${player.name} takes ${totalTaken} coins from other players (${cardName})`);
                        break;
                    case 'take_5_coins_from_one_player':
                        // choose one player to take 5 coins from
                        let nonActivePlayers2 = game.players.filter(p => p !== player);
                        let richestPlayer = nonActivePlayers2.reduce((a, b) => a.budget > b.budget ? a : b);
                        let payment2 = Math.min(5, richestPlayer.budget);
                        richestPlayer.budget -= payment2;
                        player.budget += payment2;
                        logger.info(`Player ${player.name} takes ${payment2} coins from player ${richestPlayer.name} (${cardName})`);
                        break;
                    case 'switch_1_non_tower_card_with_one_player':
                        let result = await player.strategy.swap(game);
                        if (result === null) {
                            logger.info(`Player ${player.name} decided not to swap cards`);
                            break;
                        } else {
                            let { give, take, otherPlayerIndex } = result;
                            let otherPlayer = game.players[otherPlayerIndex!];
                            if (cards.find(v => v.name === give)?.color === 'purple' ||
                                cards.find(v => v.name === take)?.color === 'purple') {
                                logger.warn(`Player ${player.name} cannot swap tower cards`);
                                break;
                            }
                            if ((player.deck[give] || 0) < 1) {
                                logger.warn(`Player ${player.name} does not have card ${give} to give`);
                                break;
                            }
                            player.deck[give]! -= 1;
                            otherPlayer.deck[give] = (otherPlayer.deck[give] || 0) + 1;
                            otherPlayer.deck[take]! -= 1;
                            player.deck[take] = (player.deck[take] || 0) + 1;
                            logger.info(`Player ${player.name} swapped ${give} with player ${otherPlayer.name} for ${take}`);
                        }

                        break;
                }
            }
        }
    }
}