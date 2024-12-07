import session from "express-session";
import { secret } from "../../config/secret";

export const sessionMiddleware = session({
    secret: secret.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: secret.nodeEnv === 'production',httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
})