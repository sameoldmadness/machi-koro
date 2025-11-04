import { cards, Player, State } from "./game";
import { cogStrategy, openaiStrategy, shopStrategy } from "./strategy";
import { buy, createGame, createPlayer, getPlayersToProcess, playerHasWon, printtt, roll, shuffle } from "./utils";

export async function initGame() {
    const playerA = createPlayer('A', cogStrategy);
    const playerB = createPlayer('B', openaiStrategy);
    const playerC = createPlayer('C', shopStrategy);

    const game = createGame(shuffle([playerA, playerB, playerC]));

    await runGame(game, 3);
}

export async function runGame(game: State, maxSteps: number = 1000) {
    for (let i = 0; i < maxSteps; i += 1) {
        printtt(`Step number ${i}`);
        game.activePlayerIndex += 1;
        game.activePlayerIndex %= game.players.length;
        let player = game.players[game.activePlayerIndex];
        printtt(`Active player: ${player.name}`);
        let nDice = await player.strategy.roll(game);
        printtt(`Player decides to roll ${nDice} dice(s)`);
        let [res, rolls] = roll(nDice);
        printtt(`Player rolled ${res}`);
        // TODO connect ths with reroll strategy and amusement cards
        if (player.amusementDeck['Radio Tower']) {
            let nDice = await player.strategy.reroll(res, game);
            if (nDice) {
                [res, rolls] = roll(nDice);
                printtt(`Player rerolled ${res}`);
            } else {
                printtt(`Player decides not to reroll`);
            }
        }
        await process(res, game);
        if (rolls[0] === rolls[1] && player.amusementDeck['Amusement Park']) {
            printtt(`Player rolled double and gets to roll again`);
            let [res2, rolls2] = roll(nDice);
            printtt(`Player rolled ${res2}`);
            process(res2, game);
            // TODO allow to reroll here if not rerolled before
        }
        printtt(`Player has ${player.budget} coins`);
        let purchase = await player.strategy.buy(game);
        if (purchase) {
            printtt(`Player decides to buy ${purchase}`);
            buy(purchase, player, game);
        } else {
            printtt(`Player decides to skip`);
        }
        if (playerHasWon(player)) {
            // wins[player.name as 'A' | 'B' | 'C'] += 1;
            printtt(`Player ${player.name} has won the game!`);
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
                }
            }
            player.budget += income;

            if (card.specialRule) {
                switch (card.specialRule) {
                    case 'take_2_coins_from_every_player':
                        // each other player gives 2 coins to this player
                        // find all players that are not the current player
                        let nonActivePlayers = game.players.filter(p => p !== player);
                        for (const otherPlayer of nonActivePlayers) {
                            let payment = Math.min(2, otherPlayer.budget);
                            otherPlayer.budget -= payment;
                            player.budget += payment;
                        }
                        printtt(`Player ${player.name} takes 2 coins from every other player`);
                        break;
                    case 'take_5_coins_from_one_player':
                        // choose one player to take 5 coins from
                        let nonActivePlayers2 = game.players.filter(p => p !== player);
                        let richestPlayer = nonActivePlayers2.reduce((a, b) => a.budget > b.budget ? a : b);
                        let payment2 = Math.min(5, richestPlayer.budget);
                        richestPlayer.budget -= payment2;
                        player.budget += payment2;
                        printtt(`Player ${player.name} takes ${payment2} coins from player ${richestPlayer.name}`);
                        break;
                    case 'switch_1_non_tower_card_with_one_player':
                        let result = await player.strategy.swap(game);
                        if (result === null) {
                            printtt(`Player ${player.name} decided not to swap cards`);
                            break;
                        } else {
                            let { give, take, otherPlayerIndex } = result;
                            let otherPlayer = game.players[otherPlayerIndex!];
                            if (cards.find(v => v.name === give)?.color === 'purple' ||
                                cards.find(v => v.name === take)?.color === 'purple') {
                                printtt(`Player ${player.name} cannot swap tower cards`);
                                break;
                            }
                            if ((player.deck[give] || 0) < 1) {
                                printtt(`Player ${player.name} does not have card ${give} to give`);
                                break;
                            }
                            player.deck[give]! -= 1;
                            otherPlayer.deck[give] = (otherPlayer.deck[give] || 0) + 1;
                            otherPlayer.deck[take]! -= 1;
                            player.deck[take] = (player.deck[take] || 0) + 1;
                            printtt(`Player ${player.name} swapped card ${give} with player ${otherPlayer.name} for card ${take}`);
                        }

                        break;
                }
            }
        }
    }
}