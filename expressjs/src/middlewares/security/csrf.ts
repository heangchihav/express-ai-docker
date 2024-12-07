import csurf from 'csurf';
import { RequestHandler } from 'express';
import { secret } from '../../config/secret';

export const csrfProtection: RequestHandler = csurf({
    cookie: {
        httpOnly: true,
        secure: secret.nodeEnv === 'production', // Use secure cookies in production
        sameSite: 'strict', // Adjust according to your use case
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    value: (req: any) => {
        return req.headers['x-csrf-token'];
    }
});
