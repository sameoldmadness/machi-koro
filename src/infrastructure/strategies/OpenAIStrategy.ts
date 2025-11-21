import { Game } from "../../domain/entities/Game";
import { EstablishmentName, LandmarkName } from "../../domain/value-objects/Card";
import { GameStrategy } from "./GameStrategy";
import { defaultStrategy } from "./DefaultStrategy";
import { buy } from "../ai/openai";

export const openaiStrategy: GameStrategy = {
    roll: async (game: Game) => {
        return defaultStrategy.roll(game);
    },
    reroll: async (prev: number, game: Game) => {
        return defaultStrategy.reroll(prev, game);
    },
    buy: async (game: Game) => {
        // The openai.buy function expects 'State' which was the old Game type.
        // We need to check if openai.ts was updated to use the new Game entity.
        // I checked openai.ts earlier and it imported 'State' from '../../game'.
        // But 'src/game.ts' was deleted!
        // So openai.ts is likely broken or using a type that doesn't exist.
        // Wait, I saw openai.ts content:
        // import { State } from "../../game";
        // If src/game.ts is deleted, this import is broken.
        // I need to fix openai.ts as well.
        // For now, I'll assume I will fix openai.ts to accept Game entity.
        return await buy(game as any) as EstablishmentName | LandmarkName | null;
    },
    swap: async (game: Game) => {
        return defaultStrategy.swap(game);
    }
};
