import { ErrorRequestHandler } from 'express';
import { createRequire } from 'node:module';

import { Logger } from '../services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export function handleError(): ErrorRequestHandler {
    return (error, req, res, _next) => {
        Logger.error(
            Logs.error.apiRequest.replace('{HTTP_METHOD}', req.method).replace('{URL}', req.url),
            error
        );
        res.status(500).json({ error: true, message: error.message });
    };
}
