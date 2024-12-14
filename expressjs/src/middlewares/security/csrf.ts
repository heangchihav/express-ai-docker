import csurf from 'csurf';
import { Request, ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { secret } from '../../config/secret';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: secret.nodeEnv ? secret.nodeEnv === 'production' : false,
        sameSite: 'strict',
        maxAge: ONE_DAY_IN_MS
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'TRACE'],
    value: (req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>) => {
        const csrfToken = req.headers['x-csrf-token'] as string;
        if (!csrfToken) {
            throw new Error('CSRF token is missing from the request headers');
        }
        return csrfToken;
    }
});
