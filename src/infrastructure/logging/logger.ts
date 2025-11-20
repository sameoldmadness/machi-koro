import winston from 'winston';
import Transport from 'winston-transport';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Custom format for console (concise and colored)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Custom format for file (extended with metadata)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for browser (minimal - just the message)
const browserFormat = winston.format.combine(
  winston.format.printf(({ message }): string => {
    return String(message);
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  transports: [
    // Console transport (concise, colored)
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.CONSOLE_LOG_LEVEL || 'info',
    }),

    // File transport for all logs (extended)
    new DailyRotateFile({
      filename: path.join('logs', 'machi-koro-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
      level: 'debug',
    }),

    // File transport for errors only
    new DailyRotateFile({
      filename: path.join('logs', 'machi-koro-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
      level: 'error',
    }),
  ],
});

// In-memory log buffer for browser/API consumption
const browserLogs: string[] = [];
const MAX_BROWSER_LOGS = 1000;

// Custom transport for browser logs
class BrowserTransport extends Transport {
  log(info: any, callback: () => void) {
    const formatted = browserFormat.transform(info);
    if (formatted && typeof formatted === 'object') {
      const message = (formatted as any)[Symbol.for('message')] || formatted.message || String(info.message);
      browserLogs.push(message);

      // Keep only the last MAX_BROWSER_LOGS entries
      if (browserLogs.length > MAX_BROWSER_LOGS) {
        browserLogs.shift();
      }
    }
    callback();
  }
}

// Add browser transport
logger.add(new BrowserTransport({ level: 'info' }));

// Helper function to get browser logs
export function getBrowserLogs(): string[] {
  return [...browserLogs];
}

// Helper function to clear browser logs
export function clearBrowserLogs(): void {
  browserLogs.length = 0;
}

// Disable console logging during tests
if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
  logger.transports.forEach((transport) => {
    if (transport instanceof winston.transports.Console) {
      transport.silent = true;
    }
  });
}

export default logger;
