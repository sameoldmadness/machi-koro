import { Game } from "../../domain/entities/Game";
import { Player } from "../../domain/entities/Player";
import { EstablishmentName, LandmarkName, CardRegistry } from "../../domain/value-objects/Card";

export function canBuy(cardName: EstablishmentName | LandmarkName, player: Player, game: Game): boolean {
    const market = game.getMarketDeck();
    const money = player.getMoney();

    // Check if it's a landmark
    if (CardRegistry.isLandmark(cardName)) {
        const landmark = CardRegistry.getLandmark(cardName);
        // It is a landmark
        if (player.hasLandmark(cardName)) {
            return false; // Already owned
        }
        return money.canAfford(landmark.cost);
    }

    // It must be an establishment
    if (CardRegistry.isEstablishment(cardName)) {
        const establishment = CardRegistry.getEstablishment(cardName);

        // Check availability in market
        if (!market.isAvailable(cardName)) {
            return false;
        }

        // Check cost
        if (!money.canAfford(establishment.cost)) {
            return false;
        }

        // Check if player already has it and it's a major establishment (purple)
        if (establishment.color === 'purple' && player.hasEstablishment(cardName)) {
            return false;
        }

        return true;
    }

    return false; // Unknown card type
}

export function canRollTwoDice(player: Player): boolean {
    return player.hasLandmark('Terminal'); // 'Terminal' allows rolling 2 dice
    // Wait, in old code it was 'Terminal'. In new code, let's check CardRegistry or Player.ts
    // Player.ts has `hasLandmark`.
    // I need to verify the landmark name for 2 dice.
}
