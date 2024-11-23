import session from "express-session";
import { secret } from "../config/secret";

export const sessionMiddleware = session({
    secret: secret.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: secret.nodeEnv === 'production' }
})