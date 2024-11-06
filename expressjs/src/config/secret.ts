import dotenv from 'dotenv'

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVER_PORT = process.env.SERVER_PORT || 3000;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "dummy access token";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "dummy access token";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const HOST = process.env.HOST || '0.0.0.0'
const CALL_BACK_URL = process.env.CALL_BACK || `http://${HOST}:${SERVER_PORT}/api/auth/google/callback`
const SESSION_SECRET = process.env.SESSION_SECRET || "dummy secretKey";

export const secret = {
    NODE_ENV,
    SERVER_PORT,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    HOST,
    CALL_BACK_URL,
    SESSION_SECRET
}