import { amusementCards, AmusementName, Name, State, Strategy } from "./game";
import { canBuy, canRollTwoDice } from "./utils";



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
        const amusementsToBuy: AmusementName[] = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];

        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                return amusementToBuy;
            }
        }

        const cardsToBuy: Name[] = ['Apple Garden', 'Bakery', 'Business Center',
            'Cafe', 'Cheese Factory', 'Farm', 'Forest',
            'Fruit Market', 'Furniture Factory', 'Grain Field',
            'Mine', 'Restraunt', 'Shop', 'Stadium', 'TV Center'];

        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                return cardToBuy;
            }
        }

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
        // buy Grain Field if possible until you have 4
        const player = game.players[game.activePlayerIndex];
        if (canBuy('Grain Field', player, game)) {
            const currentCount = player.deck['Grain Field'] || 0;
            if (currentCount < 4) {
                return 'Grain Field';
            }
        }
        // buy Terminal if possible
        if (!player.amusementDeck['Terminal']) {
            const terminalCard = amusementCards.find(v => v.name === 'Terminal')!;
            if (terminalCard.cost <= player.budget) {
                return 'Terminal';
            }
        }
        // buy Fruit Market if possible until you have 4
        if (canBuy('Fruit Market', player, game)) {
            const currentCount = player.deck['Fruit Market'] || 0;
            if (currentCount < 4) {
                return 'Fruit Market';
            }
        }
        // buy Apple Garden if possible until you have 2
        if (canBuy('Apple Garden', player, game)) {
            const currentCount = player.deck['Apple Garden'] || 0;
            if (currentCount < 2) {
                return 'Apple Garden';
            }
        }
        // buy amusement cards in order Shopping Center, Amusement Park, Radio Tower if possible
        const amusementsToBuy: AmusementName[] = ['Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                return amusementToBuy;
            }
        }
        // buy Grain Field, Fruit Market, Apple Garden in that order
        const cardsToBuy: Name[] = ['Grain Field', 'Fruit Market', 'Apple Garden'];
        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                return cardToBuy;
            }
        }
        // fallback to default strategy
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
        if (canBuy('Shop', player, game)) {
            const currentCount = player.deck['Shop'] || 0;
            if (currentCount < 6) {
                return 'Shop';
            }
        }
        if (canBuy('Cafe', player, game)) {
            const currentCount = player.deck['Cafe'] || 0;
            if (currentCount < 0) {
                return 'Cafe';
            }
        }

        // if (canBuy('TV Center', player, game)) {
        //     return 'TV Center';
        // }

        const terminalCard = amusementCards.find(v => v.name === 'Shopping Center')!;
        if (!player.amusementDeck['Shopping Center'] && terminalCard.cost <= player.budget) {
            return 'Shopping Center';
        }

        const amusementsToBuy: AmusementName[] = ['Terminal', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                return amusementToBuy;
            }
        }

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
        if (canBuy('Forest', player, game)) {
            const currentCount = player.deck['Forest'] || 0;
            if (currentCount < 4) {
                return 'Forest';
            }
        }
        if (!player.amusementDeck['Terminal']) {
            const terminalCard = amusementCards.find(v => v.name === 'Terminal')!;
            if (terminalCard.cost <= player.budget) {
                return 'Terminal';
            }
        }
        if (canBuy('Furniture Factory', player, game)) {
            const currentCount = player.deck['Furniture Factory'] || 0;
            if (currentCount < 4) {
                return 'Furniture Factory';
            }
        }

        const amusementsToBuy: AmusementName[] = ['Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            const amusementCard = amusementCards.find(v => v.name === amusementToBuy)!;
            if (!player.amusementDeck[amusementToBuy] && amusementCard.cost <= player.budget) {
                return amusementToBuy;
            }
        }

        return null;
    },
    swap: async (game: State) => {
        return defaultStrategy.swap(game);
    }
}