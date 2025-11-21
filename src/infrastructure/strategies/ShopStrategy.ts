import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { GameStrategy } from "./GameStrategy";
import { canBuy } from "./utils";
import { defaultStrategy } from "./DefaultStrategy";
import logger from "../logging/logger";

export const shopStrategy: GameStrategy = {
    roll: async (game: Game) => {
        return 1;
    },
    reroll: async (prev: number, game: Game) => {
        return null;
    },
    buy: async (game: Game) => {
        const player = game.getCurrentPlayer();
        logger.debug(`shopStrategy.buy: Player ${player.name} evaluating shop-focused strategy with ${player.getMoney().getValue()} coins`);

        if (canBuy('Shop', player, game)) {
            const currentCount = player.getEstablishmentCount('Shop');
            if (currentCount < 6) {
                logger.debug(`shopStrategy.buy: Buying Shop (${currentCount}/6)`);
                return 'Shop';
            }
        }
        if (canBuy('Cafe', player, game)) {
            const currentCount = player.getEstablishmentCount('Cafe');
            if (currentCount < 0) {
                logger.debug(`shopStrategy.buy: Buying Cafe (${currentCount}/0)`);
                return 'Cafe';
            }
        }

        if (canBuy('Shopping Center', player, game)) {
            logger.debug(`shopStrategy.buy: Buying Shopping Center`);
            return 'Shopping Center';
        }

        const amusementsToBuy: LandmarkName[] = ['Terminal', 'Amusement Park', 'Radio Tower'];
        for (const amusementToBuy of amusementsToBuy) {
            if (canBuy(amusementToBuy, player, game)) {
                logger.debug(`shopStrategy.buy: Buying ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        logger.debug(`shopStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: Game) => {
        return defaultStrategy.swap(game);
    }
};
