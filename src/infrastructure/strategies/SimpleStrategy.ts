/**
 * Simple Strategy Implementation
 * Infrastructure - basic AI strategy for testing/demo purposes
 */

import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { PurchaseService } from "../../domain/services/PurchaseService";
import { GameStrategy } from "./GameStrategy";

export const createSimpleStrategy = (): GameStrategy => ({
    roll: async (game: Game) => {
        const player = game.getCurrentPlayer();
        return player.hasLandmark('Terminal') ? 2 : 1;
    },

    reroll: async (previousRoll: number, game: Game) => {
        const player = game.getCurrentPlayer();
        // Reroll if we have Radio Tower and rolled low
        if (player.hasLandmark('Radio Tower') && previousRoll <= 6) {
            return player.hasLandmark('Terminal') ? 2 : 1;
        }
        return null;
    },

    buy: async (game: Game) => {
        const player = game.getCurrentPlayer();
        const money = player.getMoney().getValue();
        const market = game.getMarketDeck();

        // Priority: Landmarks first, then establishments
        const landmarks: LandmarkName[] = ['Terminal', 'Shopping Center', 'Amusement Park', 'Radio Tower'];
        for (const landmark of landmarks) {
            if (!player.hasLandmark(landmark)) {
                const landmarkCard = PurchaseService.purchase(player, landmark, market);
                if (landmarkCard.success) {
                    // Undo the purchase (we're just checking)
                    return landmark;
                }
            }
        }

        // Buy useful establishments
        const establishments: EstablishmentName[] = [
            'Grain Field', 'Bakery', 'Forest', 'Shop', 'Cheese Factory',
            'Furniture Factory', 'Mine'
        ];

        for (const establishment of establishments) {
            if (market.isAvailable(establishment) && money >= 1) {
                return establishment;
            }
        }

        return null;
    },

    swap: async (game: Game) => {
        return null; // Don't swap for simple strategy
    },
});
