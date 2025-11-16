import { cards, Player, State } from "./game";
import { cogStrategy, grainStrategy, shopStrategy } from "./strategy";
import { buy, createGame, createPlayer, getPlayersToProcess, playerHasWon, roll, shuffle } from "./utils";
import logger from "./logger";

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
        await process(res, game);
        if (rolls[0] === rolls[1] && player.amusementDeck['Amusement Park']) {
            logger.info(`Player rolled double and gets to roll again`);
            let [res2, rolls2] = roll(nDice);
            logger.info(`Player rolled ${res2}` + (nDice > 1 ? ` (${rolls2.join('+')})` : ''));
            process(res2, game);
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

async function process(res: number, game: State) {
    const playersToProcess = getPlayersToProcess(game.activePlayerIndex, game.players);

    for (const [index, player] of playersToProcess.entries()) {
        const isActivePlayer = index === 0; // The first player in the reordered list is the active player
        await processPlayer(res, player, isActivePlayer, game);
    }
}

async function processPlayer(res: number, player: Player, isActivePlayer: boolean, game: State) {
    for (const [cardName, count] of Object.entries(player.deck)) {
        const card = cards.find(v => v.name === cardName)!;

        // Determine if the card should be processed based on its color and player type
        const isGreenOrPurple = (card.color === 'green' || card.color === 'purple') && isActivePlayer;
        const isBlue = card.color === 'blue';
        const isRed = card.color === 'red' && !isActivePlayer;

        if (card.match.includes(res) && (isGreenOrPurple || isBlue || isRed)) {
            let income = 0;
            if (card.income) {
                let cardIncome = card.income;

                if (player.amusementDeck['Shopping Center']) {
                    if (card.kind === 'bread' || card.kind === 'coffee') {
                        if (cardIncome) {
                            logger.debug(`Shopping Center bonus: +1 coin for ${cardName}`);
                            cardIncome += 1;
                        }
                    }
                }

                income += cardIncome * count;
            }
            if (card.multiplier) {
                for (const [kind, mult] of Object.entries(card.multiplier)) {
                    const kindCount = Object.entries(player.deck)
                        .filter(([name, _]) => {
                            const c = cards.find(v => v.name === name)!;
                            return c.kind === kind;
                        })
                        .reduce((a, [_, cnt]) => a + cnt, 0);
                    income += (kindCount * mult!) * count;
                    logger.debug(`${cardName} multiplier: ${kindCount} ${kind}(s) × ${mult} × ${count} = ${(kindCount * mult!) * count} coins`);
                }
            }

            if (income > 0) {
                player.budget += income;
                logger.debug(`${player.name} earned ${income} coins from ${count}x ${cardName} (${card.color})`);
            }

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