import express, { Application} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";
import bodyParser from "body-parser";
import xssClean from "xss-clean";
import hpp from "hpp";
import path from "path";
import * as expressWinston from "express-winston";
import cors from "cors";

// Import configuration and routes
import { corsOptions } from "./config/corsOption";
import morganMiddleware from "./middlewares/morgan";
import Logger, { errorLogger } from "./config/logger";
import csrfProtection from "./middlewares/csrf";
import { compressionMiddleware } from "./middlewares/compression";
import { limiterMiddleware } from "./middlewares/limiter";
import { sessionMiddleware } from "./middlewares/session";
import { mlSecurityMiddleware } from "./fastAPIMiddlewares/mlSecurity";
import rootRouter from "./routes";
import { errorMiddleware } from "./middlewares/errors";

// Initialize authentication strategies
import "./strategies/jwtStrategy";
import "./strategies/googleStrategy";
import authMiddleware from "./middlewares/auth";

// Validate environment variables on startup
import "./config/env.validation";

const app: Application = express();

// === Middleware ===

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.SECURITY_SERVICE_URL || 'http://localhost:8000'],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: true,
    xssFilter: true
}));
app.use(xssClean());
app.use(hpp());

// ML-powered security middleware
app.use(mlSecurityMiddleware);

// Rate limiting
app.use(limiterMiddleware);

// Compression Middleware
app.use(compressionMiddleware);

// CORS Middleware
app.use(cors(corsOptions));

// Request Logging Middleware
app.use(morganMiddleware);
app.use(expressWinston.logger({
    winstonInstance: Logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true
}));

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

// Session Middleware
app.use(sessionMiddleware);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Apply Authentication Middleware
app.use(authMiddleware);

// CSRF Protection
app.use(csrfProtection);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// === Routes ===
app.use("/api", rootRouter);

// === Error Handling ===
app.use(errorMiddleware);
app.use(expressWinston.errorLogger({
    winstonInstance: errorLogger
}));

export default app;
