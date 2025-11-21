import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { MarketDeck } from '../../domain/entities/MarketDeck';
import { Money } from '../../domain/value-objects/Money';
import { cogStrategy } from './CogStrategy';

describe('CogStrategy', () => {
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

    it('should prioritize Forest if count < 4', async () => {
        player.addMoney(Money.of(10));
        const result = await cogStrategy.buy(game);
        expect(result).toBe('Forest');
    });

    it('should prioritize Terminal', async () => {
        // Give 4 Forests
        for (let i = 0; i < 4; i++) player.addEstablishment('Forest');
        player.addMoney(Money.of(10));

        const result = await cogStrategy.buy(game);
        expect(result).toBe('Terminal');
    });

    it('should prioritize Furniture Factory if count < 4', async () => {
        for (let i = 0; i < 4; i++) player.addEstablishment('Forest');
        player.buildLandmark('Terminal');
        player.addMoney(Money.of(10));

        const result = await cogStrategy.buy(game);
        expect(result).toBe('Furniture Factory');
    });
});
