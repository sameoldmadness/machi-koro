import './.env';

import express, { Request, Response } from 'express';
import { defaultStrategy } from './strategy';
import { State } from './game';
import { initGame } from './engine';
import { logFlush } from './utils';
import logger, { getBrowserLogs } from './logger';

type ActionName = string;
type AnyPayload = unknown;

interface AgentAction {
    action: ActionName;
    payload?: AnyPayload;
}

const app = express();
app.use(express.json());

app.get('/server', async (_req: Request, res: Response) => {
    logger.info('Starting game via /server endpoint');
    await initGame();
    const logs = logFlush();
    logger.info('Game completed successfully');
    res.json({ status: 'ok', time: new Date().toISOString(), log: logs });
});

app.post('/server', (req: Request<{}, {}, AgentAction>, res: Response) => {
    const { action, payload } = req.body ?? {};
    if (!action || typeof action !== 'string') {
        logger.warn('Invalid /server POST request: missing action');
        return res.status(400).json({ error: 'Request body must include "action" (string) and optional "payload".' });
    }

    logger.debug(`Server action received: ${action}`);
    return res.json({ handledBy: 'server', action, payload });
});

// Endpoint to get browser logs
app.get('/logs', (_req: Request, res: Response) => {
    const logs = getBrowserLogs();
    res.json({ logs, count: logs.length });
});

/**
 * Agent routes: agent id in path, POST accepts { action: string, payload: any }
 */
app.get('/agent/:id', (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    // TODO: return agent info/state if available
    res.json({ agentId: id, status: 'ready' });
});

app.post('/agent/:id', async (req: Request<{ id: string }, {}, AgentAction>, res: Response) => {
    try {
        const { id } = req.params;
        const { action, payload } = req.body ?? {};

        if (!action || typeof action !== 'string') {
            logger.warn(`Invalid agent request from agent ${id}: missing action`);
            return res.status(400).json({ error: 'Request body must include "action" (string) and optional "payload".' });
        }

        logger.debug(`Agent ${id} action: ${action}`);

        const strategy = defaultStrategy;
        let response;

        switch (action) {
            case 'roll': {
                const { game } = payload as { game: State };
                // Ensure activePlayerIndex is valid
                if (game.activePlayerIndex < 0) {
                    game.activePlayerIndex = 0;
                }
                response = await strategy.roll(game);
                logger.debug(`Agent ${id} roll result: ${response}`);
                break;
            }
            case 'reroll': {
                const { previousRoll, game } = payload as { previousRoll: number; game: State };
                // Ensure activePlayerIndex is valid
                if (game.activePlayerIndex < 0) {
                    game.activePlayerIndex = 0;
                }
                response = await strategy.reroll(previousRoll, game);
                logger.debug(`Agent ${id} reroll result: ${response}`);
                break;
            }
            case 'buy': {
                const { game } = payload as { game: State };
                // Ensure activePlayerIndex is valid
                if (game.activePlayerIndex < 0) {
                    game.activePlayerIndex = 0;
                }
                response = await strategy.buy(game);
                logger.debug(`Agent ${id} buy result: ${response}`);
                break;
            }
            case 'swap': {
                const { game } = payload as { game: State };
                // Ensure activePlayerIndex is valid
                if (game.activePlayerIndex < 0) {
                    game.activePlayerIndex = 0;
                }
                response = await strategy.swap(game);
                logger.debug(`Agent ${id} swap result: ${response}`);
                break;
            }
            default:
                logger.warn(`Unknown action "${action}" from agent ${id}`);
                return res.status(400).json({ error: `Unknown action "${action}"` });
        }

        return res.json({
            handledBy: 'agent',
            agentId: id,
            action,
            payload,
            response,
            processedAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error(`Error processing agent action: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
    app.listen(port, () => {
        logger.info(`🚀 Server started on http://localhost:${port}`);
        logger.info(`📊 Logs endpoint: http://localhost:${port}/logs`);
    });
}

export default app;