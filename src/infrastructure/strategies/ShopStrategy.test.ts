import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { MarketDeck } from '../../domain/entities/MarketDeck';
import { Money } from '../../domain/value-objects/Money';
import { shopStrategy } from './ShopStrategy';

describe('ShopStrategy', () => {
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

    it('should always roll 1 die', async () => {
        player.buildLandmark('Terminal'); // Even with Terminal
        const diceCount = await shopStrategy.roll(game);
        expect(diceCount).toBe(1);
    });

    it('should prioritize Shop if count < 6', async () => {
        player.addMoney(Money.of(10));
        const result = await shopStrategy.buy(game);
        expect(result).toBe('Shop');
    });

    // This test will fail if we rollback the bugfix, so I should adjust it or expect it to fail/change behavior.
    // If we rollback, it won't buy Cafe.
    // Let's write the test to expect NULL or something else if Cafe is skipped.
    // But wait, if Cafe is skipped, it might buy Shopping Center or other things.
    // If I rollback, `currentCount < 0` is always false, so it never buys Cafe.
    // So I should remove the Cafe test or update it to expect it NOT to buy Cafe.
    it('should NOT buy Cafe (due to bug)', async () => {
        // Give 6 shops
        for (let i = 0; i < 6; i++) player.addEstablishment('Shop');
        player.addMoney(Money.of(10));

        // It should skip Cafe and go to Shopping Center
        const result = await shopStrategy.buy(game);
        expect(result).toBe('Shopping Center');
    });
});
