import { amusementCards, AmusementName, cards, deck, Name, Player, startingAmusementDeck, startingBudget, startingDeck, State, Strategy } from "./game";
import logger, { getBrowserLogs, clearBrowserLogs } from "./logger";

export function clone<T>(x: T): T {
    return JSON.parse(JSON.stringify(x));
}

export function createPlayer(name: string, strategy: Strategy): Player {
    return {
        name,
        deck: clone(startingDeck),
        amusementDeck: clone(startingAmusementDeck),
        budget: startingBudget,
        strategy,
    }
}

export function createGame(players: Player[]): State {
    return {
        deck: clone(deck),
        players,
        activePlayerIndex: -1,
    };
}

export function dump(x: any) {
    logger.info(JSON.stringify(x, null, 2));
}

export function canRollTwoDice(player: Player): boolean {
    return player.amusementDeck.Terminal;
}

export function getCost(cardName: Name): number {
    const card = cards.find(v => v.name === cardName);
    return card!.cost;
}

export function canBuy(cardName: Name, player: Player, game: State): boolean {
    if (cards.find(v => v.name === cardName)?.singular && player.deck[cardName as Name]) {
        return false;
    }

    return game.deck[cardName] > 0 && getCost(cardName) <= player.budget;
}
export function roll(dice: number): [number, number[]] {
    let rolls = new Array(dice).fill(null).map(rollOne);
    let total = rolls.reduce((a, b) => a + b);

    return [total, rolls];
}

export function rollOne(): number {
    return Math.floor(Math.random() * 6) + 1;
}

export function buy(name: Name | AmusementName, player: Player, game: State) {
    const amusementCard = amusementCards.find(v => v.name === name);

    if (amusementCard) {
        // Validate amusement card purchase
        if (player.budget < amusementCard.cost) {
            logger.warn(`Player cannot afford ${name}`);
            return;
        }
        if (player.amusementDeck[name as AmusementName]) {
            logger.warn(`Player already owns ${name}`);
            return;
        }

        player.amusementDeck[name as AmusementName] = true;
        player.budget -= amusementCard.cost;
        logger.debug(`Player purchased ${name} for ${amusementCard.cost} coins`);
        return;
    }

    // Validate regular card purchase
    const cost = getCost(name as Name);
    if (player.budget < cost) {
        logger.warn(`Player cannot afford ${name}`);
        return;
    }
    if (game.deck[name as Name] <= 0) {
        logger.warn(`${name} is out of stock`);
        return;
    }
    const card = cards.find(v => v.name === name);
    if (card?.singular && player.deck[name as Name]) {
        logger.warn(`Player already owns ${name}`);
        return;
    }

    game.deck[name as Name] -= 1;
    player.budget -= cost;
    player.deck[name as Name] = player.deck[name as Name] || 0;
    player.deck[name as Name]! += 1;
    logger.debug(`Player purchased ${name} for ${cost} coins`);
}

export function getPlayersToProcess(activePlayerIndex: number, players: Player[]): Player[] {
    return players.slice(activePlayerIndex).concat(players.slice(0, activePlayerIndex));
}

export function playerHasWon(player: Player): boolean {
    // win if all amusement cards are bought
    return Object.values(player.amusementDeck).every(v => v);
}


// Legacy logging functions for backward compatibility with tests
export function logAdd(msg: string) {
    // Messages are now automatically added to browser logs by the logger
    logger.info(msg);
}

export function logFlush() {
    const logs = getBrowserLogs();
    clearBrowserLogs();
    return logs;
}

// Deprecated: use logger.info() instead
export function printtt(msg: string) {
    logger.info(msg);
}

export function shuffle(array: Player[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}