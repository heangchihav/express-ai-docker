import { Express } from 'express';
import cookieParser from 'cookie-parser';
import { morganMiddleware } from './logging';
import { errorHandlerMiddleware, notFoundHandlerMiddleware } from './error';
import { compressionMiddleware, rateLimiterMiddleware } from './performance';
import { sessionMiddleware, authMiddleware } from './auth';
import { corsMiddleware, helmetSecurityMiddleware, csrfProtection } from './security';
import passport from 'passport';

export const configureBasicMiddlewares = (app: Express): void => {
    // Basic middleware setup
    if (compressionMiddleware) app.use(compressionMiddleware);
    if (cookieParser) app.use(cookieParser());
    if (corsMiddleware) app.use(corsMiddleware);
};

export const configureLoggingMiddlewares = (app: Express): void => {
    if (morganMiddleware) app.use(morganMiddleware);
};

export const configureSecurityMiddlewares = (app: Express): void => {
    if (helmetSecurityMiddleware) app.use(helmetSecurityMiddleware);
    if (rateLimiterMiddleware) app.use(rateLimiterMiddleware);
    if (csrfProtection) app.use(csrfProtection);
};

export const configureAuthMiddlewares = (app: Express): void => {
    // Initialize Passport
    app.use(passport.initialize());

    // Session configuration (if needed for other strategies)
    if (sessionMiddleware) app.use(sessionMiddleware);
    app.use(passport.session());

    // Auth middleware
    if (authMiddleware) app.use(authMiddleware);
};

export const configureErrorHandling = (app: Express): void => {
    // Handle 404
    if (notFoundHandlerMiddleware) app.use(notFoundHandlerMiddleware);

    // Global error handler
    if (errorHandlerMiddleware) app.use(errorHandlerMiddleware);
};
