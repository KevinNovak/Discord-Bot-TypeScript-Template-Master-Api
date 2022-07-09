import { Response } from 'node-fetch';
import { createRequire } from 'node:module';
import pino from 'pino';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

let logger = pino(
    {
        formatters: {
            level: label => {
                return { level: label };
            },
        },
    },
    Config.logging.pretty
        ? pino.transport({
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  ignore: 'pid,hostname',
                  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
              },
          })
        : undefined
);

export class Logger {
    public static info(message: string, obj?: any): void {
        obj ? logger.info(obj, message) : logger.info(message);
    }

    public static warn(message: string, obj?: any): void {
        obj ? logger.warn(obj, message) : logger.warn(message);
    }

    public static async error(message: string, obj?: any): Promise<void> {
        // Log just a message if no error object
        if (!obj) {
            logger.error(message);
            return;
        }

        // Otherwise log details about the error
        if (typeof obj === 'string') {
            logger
                .child({
                    message: obj,
                })
                .error(message);
        } else if (obj instanceof Response) {
            let resText: string;
            try {
                resText = await obj.text();
            } catch {
                // Ignore
            }
            logger
                .child({
                    path: obj.url,
                    statusCode: obj.status,
                    statusName: obj.statusText,
                    headers: obj.headers.raw(),
                    body: resText,
                })
                .error(message);
        } else {
            logger.error(obj, message);
        }
    }
}
