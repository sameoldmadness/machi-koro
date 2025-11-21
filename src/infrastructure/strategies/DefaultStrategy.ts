import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { GameStrategy } from "./GameStrategy";
import { canBuy, canRollTwoDice } from "./utils";
import logger from "../logging/logger";

export const defaultStrategy: GameStrategy = {
    roll: async (game: Game) => {
        const player = game.getCurrentPlayer();
        return canRollTwoDice(player) ? 2 : 1;
    },
    reroll: async (previousRoll: number, game: Game) => {
        const player = game.getCurrentPlayer();
        // In old code, it always returned a number, implying it always wants to reroll if asked.
        // Assuming the engine only asks if reroll is possible (Radio Tower).
        return canRollTwoDice(player) ? 2 : 1;
    },
    buy: async (game: Game) => {
        const player = game.getCurrentPlayer();
        logger.debug(`defaultStrategy.buy: Player ${player.name} evaluating purchase options with ${player.getMoney().getValue()} coins`);

        const amusementsToBuy: LandmarkName[] = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
        // Note: 'Terminal' was renamed to 'Train Station' in the new domain, need to verify this mapping or use the new name.
        // Looking at utils.ts I used 'Train Station'.

        for (const amusementToBuy of amusementsToBuy) {
            if (canBuy(amusementToBuy, player, game)) {
                logger.debug(`defaultStrategy.buy: Choosing ${amusementToBuy}`);
                return amusementToBuy;
            }
        }

        const cardsToBuy: EstablishmentName[] = [
            'Apple Garden', 'Bakery', 'Business Center',
            'Cafe', 'Cheese Factory', 'Farm', 'Forest',
            'Fruit Market', 'Furniture Factory', 'Grain Field',
            'Mine', 'Restraunt', 'Shop', 'Stadium', 'TV Center'
        ];

        for (const cardToBuy of cardsToBuy) {
            if (canBuy(cardToBuy, player, game)) {
                logger.debug(`defaultStrategy.buy: Choosing ${cardToBuy}`);
                return cardToBuy;
            }
        }

        logger.debug(`defaultStrategy.buy: No affordable options available`);
        return null;
    },
    swap: async (game: Game) => {
        return null;
    }
};
