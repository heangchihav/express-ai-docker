import dotenv from 'dotenv';

dotenv.config();

interface Secret {
    // Application
    nodeEnv: string;
    serverPort: number;
    host: string;

    // Authentication
    accessTokenSecret: string;
    refreshTokenSecret: string;
    sessionSecret: string;

    // Google OAuth
    googleClientId: string;
    googleClientSecret: string;
    googleCallbackUrl: string;

    // FastAPI Integration
    fastApiUrl: string;
    securityServiceApiKey: string;
    riskThreshold: number;
    whitelistedIPs: string[];
}

// Load and validate environment variables
const loadEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
};

// Application settings
const NODE_ENV = loadEnvVar('NODE_ENV', 'development');
const SERVER_PORT = parseInt(loadEnvVar('SERVER_PORT', '3000'), 10);
const HOST = loadEnvVar('HOST', '0.0.0.0');

// Authentication secrets
const ACCESS_TOKEN_SECRET = loadEnvVar('ACCESS_TOKEN_SECRET', 'dummy_access_token');
const REFRESH_TOKEN_SECRET = loadEnvVar('REFRESH_TOKEN_SECRET', 'dummy_refresh_token');
const SESSION_SECRET = loadEnvVar('SESSION_SECRET', 'dummy_session_secret');

// Google OAuth settings
const GOOGLE_CLIENT_ID = loadEnvVar('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = loadEnvVar('GOOGLE_CLIENT_SECRET');
const GOOGLE_CALLBACK_URL = loadEnvVar('CALL_BACK_URL', 
    `http://${HOST}:${SERVER_PORT}/api/auth/google/callback`
);

// FastAPI Integration settings
const FASTAPI_URL = loadEnvVar('FASTAPI_URL', 'http://localhost:8000');
const SECURITY_SERVICE_API_KEY = loadEnvVar('SECURITY_SERVICE_API_KEY', '');
const RISK_THRESHOLD = parseFloat(loadEnvVar('RISK_THRESHOLD', '0.7'));
const WHITELISTED_IPS = loadEnvVar('WHITELISTED_IPS', '').split(',').filter(Boolean);

// Validate numeric values
if (isNaN(SERVER_PORT) || SERVER_PORT <= 0) {
    throw new Error('SERVER_PORT must be a positive number');
}

if (isNaN(RISK_THRESHOLD) || RISK_THRESHOLD < 0 || RISK_THRESHOLD > 1) {
    throw new Error('RISK_THRESHOLD must be between 0 and 1');
}

export const secret: Secret = {
    // Application
    nodeEnv: NODE_ENV,
    serverPort: SERVER_PORT,
    host: HOST,

    // Authentication
    accessTokenSecret: ACCESS_TOKEN_SECRET,
    refreshTokenSecret: REFRESH_TOKEN_SECRET,
    sessionSecret: SESSION_SECRET,

    // Google OAuth
    googleClientId: GOOGLE_CLIENT_ID,
    googleClientSecret: GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: GOOGLE_CALLBACK_URL,

    // FastAPI Integration
    fastApiUrl: FASTAPI_URL,
    securityServiceApiKey: SECURITY_SERVICE_API_KEY,
    riskThreshold: RISK_THRESHOLD,
    whitelistedIPs: WHITELISTED_IPS
};