import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { MarketDeck } from '../../domain/entities/MarketDeck';
import { Money } from '../../domain/value-objects/Money';
import { defaultStrategy } from './DefaultStrategy';

describe('DefaultStrategy', () => {
    let game: Game;
    let player: Player;
    let market: MarketDeck;

    beforeEach(() => {
        player = Player.create('p1', 'Test Player');
        const player2 = Player.create('p2', 'Player 2');
        market = MarketDeck.create('m1');
        game = Game.createWithState(
            'g1',
            [player, player2],
            market,
            0,
            'in_progress'
        );
    });

    it('should roll 1 die by default', async () => {
        const diceCount = await defaultStrategy.roll(game);
        expect(diceCount).toBe(1);
    });

    it('should roll 2 dice if player has Terminal', async () => {
        player.buildLandmark('Terminal');
        const diceCount = await defaultStrategy.roll(game);
        expect(diceCount).toBe(2);
    });

    it('should buy affordable establishment from priority list', async () => {
        player.addMoney(Money.of(10)); // Rich player
        // Default buys landmarks first
        // Terminal cost is 4
        const result = await defaultStrategy.buy(game);
        expect(result).toBe('Terminal');
    });

    it('should buy establishment if no landmarks affordable/available', async () => {
        // Player has 1 coin
        // Can buy Grain Field (1)
        const result = await defaultStrategy.buy(game);
        // List: Apple Garden, Bakery, Business Center, Cafe, Cheese Factory, Farm, Forest, Fruit Market, Furniture Factory, Grain Field...
        // Apple Garden costs 3. Bakery costs 1.
        // Player has 3 coins initially.
        // Apple Garden is first in list.
        expect(result).toBe('Apple Garden');
    });
});
