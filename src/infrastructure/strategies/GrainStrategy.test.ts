import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { MarketDeck } from '../../domain/entities/MarketDeck';
import { Money } from '../../domain/value-objects/Money';
import { grainStrategy } from './GrainStrategy';

describe('GrainStrategy', () => {
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

    it('should prioritize Cheese Factory if count < 1', async () => {
        player.addMoney(Money.of(10));
        const result = await grainStrategy.buy(game);
        expect(result).toBe('Cheese Factory');
    });

    it('should buy grain establishments if Cheese Factory satisfied', async () => {
        player.addEstablishment('Cheese Factory');
        player.addMoney(Money.of(10));
        // Landmarks are next priority in GrainStrategy
        // Terminal (4)
        const result = await grainStrategy.buy(game);
        expect(result).toBe('Terminal');
    });

    it('should fallback to default if no grain/landmarks', async () => {
        player.addEstablishment('Cheese Factory');
        // Build all landmarks to force fallback
        player.buildLandmark('Terminal');
        player.buildLandmark('Shopping Center');
        player.buildLandmark('Amusement Park');
        player.buildLandmark('Radio Tower');

        // Grain specific: Grain Field, Fruit Market, Apple Garden
        // Player has 3 coins.
        // Grain Field (1), Fruit Market (2), Apple Garden (3).
        // Order in GrainStrategy: 'Grain Field', 'Fruit Market', 'Apple Garden'.
        // So it should buy Grain Field.
        const result = await grainStrategy.buy(game);
        expect(result).toBe('Grain Field');
    });
});
