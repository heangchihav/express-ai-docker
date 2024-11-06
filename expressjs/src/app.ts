import express, { Application } from "express";
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
import rootRouter from "./routes";
import { errorMiddleware } from "./middlewares/errors";

// Initialize authentication strategies
import "./strategies/jwtStrategy";
import "./strategies/googleStrategy";
import authMiddleware from "./middlewares/auth";
import { userControlMiddleware } from "./middlewares/userControlMiddleware";

const app: Application = express();

// === Middleware ===

// Security Middleware
app.use(helmet());
app.use(xssClean());
app.use(hpp());

// Compression Middleware
app.use(compressionMiddleware);

// CORS Middleware
app.use(cors(corsOptions));

// Request Logging Middleware
app.use(morganMiddleware);
app.use(
  expressWinston.logger({
    winstonInstance: Logger,
    statusLevels: true,
  })
);

// Static File Serving Middleware
app.use(express.static(path.join(__dirname, "../public")));

// Body Parsing Middleware
app.use(bodyParser.json({ limit: "1kb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "1kb" }));
app.use(cookieParser());

// Rate Limiting Middleware
app.use(limiterMiddleware);

// Session Management Middleware
app.use(sessionMiddleware);

// Passport Middleware for Authentication
app.use(passport.initialize());

// CSRF Protection Middleware
app.use(csrfProtection);

// Auth Middleware
app.use(authMiddleware);

// Device Information Middleware to capture user device
app.use(userControlMiddleware);

// API Routes
app.use("/api", rootRouter);

// Error Logging Middleware
app.use(
  expressWinston.errorLogger({
    winstonInstance: errorLogger,
  })
);

// Error Handling Middleware
app.use(errorMiddleware);

export default app;
