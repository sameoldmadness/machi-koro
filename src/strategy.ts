import { amusementCards, AmusementName, Name, State, Strategy } from "./game";
import { buy } from "./openai";
import { canBuy, canRollTwoDice } from "./utils";
import logger from "./logger";



export const defaultStrategy: Strategy = {
    roll: async (game: State) => {
        const player = game.players[game.activePlayerIndex];

        return canRollTwoDice(player) ? 2 : 1
    },
    reroll: async (prev: number, game: State) => {
        const player = game.players[game.activePlayerIndex];

        return canRollTwoDice(player) ? 2 : 1
    },
    buy: async (game: State) => {
        const player = game.players[game.activePlayerIndex];
        logger.debug(`defaultStrategy.buy: Player ${player.name} evaluating purchase options with ${player.budget} coins`);

        const amusementsToBuy: AmusementName[] = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];

        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                logger.debug(`defaultStrategy.buy: Choosing ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        const cardsToBuy: Name[] = ['Apple Garden', 'Bakery', 'Business Center',
            'Cafe', 'Cheese Factory', 'Farm', 'Forest',
            'Fruit Market', 'Furniture Factory', 'Grain Field',
            'Mine', 'Restraunt', 'Shop', 'Stadium', 'TV Center'];

        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                logger.debug(`defaultStrategy.buy: Choosing ${cardToBuy}`);
                return cardToBuy;
            }
        }

        logger.debug(`defaultStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: State) => {
        return null;
    }
}



export const grainStrategy: Strategy = {
    roll: async (game: State) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: State) => {
        return defaultStrategy.reroll(prev, game);
    },
    buy: async (game: State) => {
        const player = game.players[game.activePlayerIndex];
        logger.debug(`grainStrategy.buy: Player ${player.name} evaluating grain-focused strategy with ${player.budget} coins`);

        // buy Grain Field if possible until you have 4
        if (canBuy('Grain Field', player, game)) {
            const currentCount = player.deck['Grain Field'] || 0;
            if (currentCount < 4) {
                logger.debug(`grainStrategy.buy: Buying Grain Field (${currentCount}/4)`);
                return 'Grain Field';
            }
        }
        // buy Terminal if possible
        if (!player.amusementDeck['Terminal']) {
            const terminalCard = amusementCards.find(v => v.name === 'Terminal')!;
            if (terminalCard.cost <= player.budget) {
                logger.debug(`grainStrategy.buy: Buying Terminal`);
                return 'Terminal';
            }
        }
        // buy Fruit Market if possible until you have 4
        if (canBuy('Fruit Market', player, game)) {
            const currentCount = player.deck['Fruit Market'] || 0;
            if (currentCount < 4) {
                logger.debug(`grainStrategy.buy: Buying Fruit Market (${currentCount}/4)`);
                return 'Fruit Market';
            }
        }
        // buy Apple Garden if possible until you have 2
        if (canBuy('Apple Garden', player, game)) {
            const currentCount = player.deck['Apple Garden'] || 0;
            if (currentCount < 2) {
                logger.debug(`grainStrategy.buy: Buying Apple Garden (${currentCount}/2)`);
                return 'Apple Garden';
            }
        }
        // buy amusement cards in order Shopping Center, Amusement Park, Radio Tower if possible
        const amusementsToBuy: AmusementName[] = ['Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                logger.debug(`grainStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }
        // buy Grain Field, Fruit Market, Apple Garden in that order
        const cardsToBuy: Name[] = ['Grain Field', 'Fruit Market', 'Apple Garden'];
        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                logger.debug(`grainStrategy.buy: Buying ${cardToBuy} (fallback)`);
                return cardToBuy;
            }
        }
        // fallback to default strategy
        logger.debug(`grainStrategy.buy: Falling back to default strategy`);
        return defaultStrategy.buy(game);
    },
    swap: async (game: State) => {
        return defaultStrategy.swap(game);
    }
}

export const shopStrategy: Strategy = {
    roll: async (game: State) => {
        return 1;
    },
    reroll: async (prev: number, game: State) => {
        return null;
    },
    buy: async (game: State) => {
        const player = game.players[game.activePlayerIndex];
        logger.debug(`shopStrategy.buy: Player ${player.name} evaluating shop-focused strategy with ${player.budget} coins`);

        if (canBuy('Shop', player, game)) {
            const currentCount = player.deck['Shop'] || 0;
            if (currentCount < 6) {
                logger.debug(`shopStrategy.buy: Buying Shop (${currentCount}/6)`);
                return 'Shop';
            }
        }
        if (canBuy('Cafe', player, game)) {
            const currentCount = player.deck['Cafe'] || 0;
            if (currentCount < 0) {
                logger.debug(`shopStrategy.buy: Buying Cafe (${currentCount}/0)`);
                return 'Cafe';
            }
        }

        // if (canBuy('TV Center', player, game)) {
        //     return 'TV Center';
        // }

        const terminalCard = amusementCards.find(v => v.name === 'Shopping Center')!;
        if (!player.amusementDeck['Shopping Center'] && terminalCard.cost <= player.budget) {
            logger.debug(`shopStrategy.buy: Buying Shopping Center`);
            return 'Shopping Center';
        }

        const amusementsToBuy: AmusementName[] = ['Terminal', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                logger.debug(`shopStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        logger.debug(`shopStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: State) => {
        return defaultStrategy.swap(game);
    }
}

export const cogStrategy: Strategy = {
    roll: async (game: State) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: State) => {
        return defaultStrategy.roll(game);
    },
    buy: async (game: State) => {
        const player = game.players[game.activePlayerIndex];
        logger.debug(`cogStrategy.buy: Player ${player.name} evaluating cog-focused strategy with ${player.budget} coins`);

        if (canBuy('Forest', player, game)) {
            const currentCount = player.deck['Forest'] || 0;
            if (currentCount < 4) {
                logger.debug(`cogStrategy.buy: Buying Forest (${currentCount}/4)`);
                return 'Forest';
            }
        }
        if (!player.amusementDeck['Terminal']) {
            const terminalCard = amusementCards.find(v => v.name === 'Terminal')!;
            if (terminalCard.cost <= player.budget) {
                logger.debug(`cogStrategy.buy: Buying Terminal`);
                return 'Terminal';
            }
        }
        if (canBuy('Furniture Factory', player, game)) {
            const currentCount = player.deck['Furniture Factory'] || 0;
            if (currentCount < 4) {
                logger.debug(`cogStrategy.buy: Buying Furniture Factory (${currentCount}/4)`);
                return 'Furniture Factory';
            }
        }

        const amusementsToBuy: AmusementName[] = ['Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                logger.debug(`cogStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        logger.debug(`cogStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: State) => {
        return defaultStrategy.swap(game);
    }
}

export const openaiStrategy: Strategy = {
    roll: async (game: State) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: State) => {
        return defaultStrategy.reroll(prev, game);
    },
    buy: async (game: State) => {
        return await buy(game) as Name | AmusementName | null;
    },
    swap: async (game: State) => {
        return defaultStrategy.swap(game);
    }
}