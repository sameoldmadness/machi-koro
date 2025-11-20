/**
 * Strategy interface for AI decision making
 * Infrastructure concern - defines how external AI/strategies interact with the game
 */

import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";

export interface GameStrategy {
    roll: (game: Game) => Promise<number>;
    reroll: (previousRoll: number, game: Game) => Promise<number | null>;
    buy: (game: Game) => Promise<EstablishmentName | LandmarkName | null>;
    swap: (game: Game) => Promise<{ give: EstablishmentName; take: EstablishmentName; otherPlayerIndex: number } | null>;
}
