import { runGame } from './engine';
import { cogStrategy, shopStrategy } from './strategy';
import { shuffle, createGame, createPlayer, dump } from './utils';
import logger from './logger';

let wins = {
    'A': 0,
    'B': 0,
    'C': 0,
};

async function main() {
    for (let j = 0; j < 10000; j += 1) {
        logger.info(`\n=== Game ${j} ===`);

        const playerA = createPlayer('A', cogStrategy);
        const playerB = createPlayer('B', shopStrategy);
        const playerC = createPlayer('C', shopStrategy);

        const game = createGame(shuffle([playerA, playerB, playerC]));

        await runGame(game);

        dump(game);
    }

    let winsWithPercentages = {
        'A': `${wins['A']} (${(wins['A'] / 10000 * 100).toFixed(2)}%)`,
        'B': `${wins['B']} (${(wins['B'] / 10000 * 100).toFixed(2)}%)`,
        'C': `${wins['C']} (${(wins['C'] / 10000 * 100).toFixed(2)}%)`,
    };
    dump(winsWithPercentages);
}
