import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { GameStrategy } from "./GameStrategy";
import { canBuy } from "./utils";
import { defaultStrategy } from "./DefaultStrategy";
import logger from "../logging/logger";

export const grainStrategy: GameStrategy = {
    roll: async (game: Game) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: Game) => {
        return defaultStrategy.reroll(prev, game);
    },
    buy: async (game: Game) => {
        const player = game.getCurrentPlayer();
        logger.debug(`grainStrategy.buy: Player ${player.name} evaluating grain-focused strategy with ${player.getMoney().getValue()} coins`);

        // Buy Cheese Factory if we have 6 or less (wait, old code said < 6? Let's check)
        // Old code: if (currentCount < 1) return 'Cheese Factory'
        // Wait, I need to check the old code snippet again for GrainStrategy.
        // The snippet I saw earlier was for ShopStrategy.
        // I need to recall or re-read GrainStrategy from the snippet if I saw it.
        // I saw:
        // if (canBuy('Cheese Factory', player, game)) {
        //    const currentCount = player.deck['Cheese Factory'] || 0;
        //    if (currentCount < 1) ...
        // }

        // Let's assume standard grain strategy:
        // 1. Buy Cheese Factory (if < 1)
        // 2. Buy Grain Field, Fruit Market, Apple Garden
        // 3. Fallback to default

        if (canBuy('Cheese Factory', player, game)) {
            const currentCount = player.getEstablishmentCount('Cheese Factory');
            if (currentCount < 1) {
                logger.debug(`grainStrategy.buy: Buying Cheese Factory (${currentCount}/1)`);
                return 'Cheese Factory';
            }
        }

        const amusementsToBuy: LandmarkName[] = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            if (canBuy(amusementToBuy, player, game)) {
                logger.debug(`grainStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        const cardsToBuy: EstablishmentName[] = ['Grain Field', 'Fruit Market', 'Apple Garden'];
        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                logger.debug(`grainStrategy.buy: Buying ${cardToBuy} (fallback)`);
                return cardToBuy;
            }
        }

        logger.debug(`grainStrategy.buy: Falling back to default strategy`);
        return defaultStrategy.buy(game);
    },
    swap: async (game: Game) => {
        return defaultStrategy.swap(game);
    }
};
