import session from "express-session";
import { secret } from "../config/secret";

export const sessionMiddleware = session({
    secret: secret.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: secret.NODE_ENV === 'production' }
})