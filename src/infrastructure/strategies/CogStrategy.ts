import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { GameStrategy } from "./GameStrategy";
import { canBuy } from "./utils";
import { defaultStrategy } from "./DefaultStrategy";
import logger from "../logging/logger";

export const cogStrategy: GameStrategy = {
    roll: async (game: Game) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: Game) => {
        return defaultStrategy.reroll(prev, game);
    },
    buy: async (game: Game) => {
        const player = game.getCurrentPlayer();
        logger.debug(`cogStrategy.buy: Player ${player.name} evaluating cog-focused strategy with ${player.getMoney().getValue()} coins`);

        if (canBuy('Forest', player, game)) {
            const currentCount = player.getEstablishmentCount('Forest');
            if (currentCount < 4) {
                logger.debug(`cogStrategy.buy: Buying Forest (${currentCount}/4)`);
                return 'Forest';
            }
        }

        if (canBuy('Terminal', player, game)) {
            logger.debug(`cogStrategy.buy: Buying Terminal`);
            return 'Terminal';
        }

        if (canBuy('Furniture Factory', player, game)) {
            const currentCount = player.getEstablishmentCount('Furniture Factory');
            if (currentCount < 4) {
                logger.debug(`cogStrategy.buy: Buying Furniture Factory (${currentCount}/4)`);
                return 'Furniture Factory';
            }
        }

        const amusementsToBuy: LandmarkName[] = ['Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            if (canBuy(amusementToBuy, player, game)) {
                logger.debug(`cogStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        logger.debug(`cogStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: Game) => {
        return defaultStrategy.swap(game);
    }
};
