import csurf from 'csurf';
import { secret } from '../config/secret';

const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: secret.nodeEnv === 'production', // Use secure cookies in production
        sameSite: 'strict', // Adjust according to your use case
    },
});

export default csrfProtection;
