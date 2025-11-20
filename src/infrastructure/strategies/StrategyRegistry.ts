/**
 * Strategy Registry
 * Infrastructure service to associate players with their strategies
 */

import { GameStrategy } from "./GameStrategy";

export class StrategyRegistry {
    private strategies: Map<string, GameStrategy> = new Map();

    register(playerId: string, strategy: GameStrategy): void {
        this.strategies.set(playerId, strategy);
    }

    get(playerId: string): GameStrategy | undefined {
        return this.strategies.get(playerId);
    }

    clear(): void {
        this.strategies.clear();
    }
}

// Singleton instance for convenience
export const strategyRegistry = new StrategyRegistry();
