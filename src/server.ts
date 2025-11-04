import express, { Request, Response } from 'express';
import { defaultStrategy } from './strategy';
import { State } from './game';
import { initGame } from './engine';
import { logFlush } from './utils';

type ActionName = string;
type AnyPayload = unknown;

interface AgentAction {
    action: ActionName;
    payload?: AnyPayload;
}

const app = express();
app.use(express.json());

app.get('/server', async (_req: Request, res: Response) => {
    await initGame();
    res.json({ status: 'ok', time: new Date().toISOString(), log: logFlush() });
});

app.post('/server', (req: Request<{}, {}, AgentAction>, res: Response) => {
    const { action, payload } = req.body ?? {};
    if (!action || typeof action !== 'string') {
        return res.status(400).json({ error: 'Request body must include "action" (string) and optional "payload".' });
    }

    return res.json({ handledBy: 'server', action, payload });
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

        const strategy = defaultStrategy;
        let response;

        switch (action) {
            case 'roll': {
                const { game } = payload as { game: State };
                response = await strategy.roll(game);
                break;
            }
            case 'reroll': {
                const { previousRoll, game } = payload as { previousRoll: number; game: State };
                response = await strategy.reroll(previousRoll, game);
                break;
            }
            case 'buy': {
                const { game } = payload as { game: State };
                response = await strategy.buy(game);
                break;
            }
            case 'swap': {
                const { game } = payload as { game: State };
                response = await strategy.swap(game);
                break;
            }
            default:
                return res.status(400).json({ error: `Unknown action "${action}"` });
        }        

        if (!action || typeof action !== 'string') {
            return res.status(400).json({ error: 'Request body must include "action" (string) and optional "payload".' });
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
        console.error('Error processing agent action:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
    app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

export default app;