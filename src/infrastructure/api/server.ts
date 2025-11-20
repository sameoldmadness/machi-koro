import '../../.env';

import express, { Request, Response } from 'express';
import { initGame } from '../../engine';
import logger, { getBrowserLogs, clearBrowserLogs } from '../logging/logger';

const app = express();
app.use(express.json());

/**
 * Main endpoint: runs a game and returns the result with logs
 */
app.get('/server', async (_req: Request, res: Response) => {
    clearBrowserLogs(); // Clear previous logs before starting
    logger.info('Starting game via /server endpoint');
    await initGame();
    logger.info('Game completed successfully');
    const logs = getBrowserLogs(); // Get logs after completion message
    res.json({ status: 'ok', time: new Date().toISOString(), log: logs });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
    app.listen(port, () => {
        logger.info(`🚀 Server started on http://localhost:${port}`);
        logger.info(`📡 Endpoint: GET http://localhost:${port}/server`);
    });
}

export default app;
