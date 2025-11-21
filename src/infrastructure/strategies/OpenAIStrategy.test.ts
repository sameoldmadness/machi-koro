import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from '../../domain/entities/Game';
import { Player } from '../../domain/entities/Player';
import { MarketDeck } from '../../domain/entities/MarketDeck';
import { openaiStrategy } from './OpenAIStrategy';
import * as openai from '../ai/openai';

// Mock OpenAI
vi.mock('../ai/openai', () => ({
    buy: vi.fn()
}));

describe('OpenAIStrategy', () => {
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

    it('should call openai.buy', async () => {
        vi.mocked(openai.buy).mockResolvedValue('Grain Field');
        const result = await openaiStrategy.buy(game);
        expect(openai.buy).toHaveBeenCalledWith(game);
        expect(result).toBe('Grain Field');
    });
});
