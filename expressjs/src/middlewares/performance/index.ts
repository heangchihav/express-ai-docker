import { RequestHandler } from 'express';
import { compressionMiddleware as compression } from './compression';
import { rateLimiterMiddleware as rateLimiter } from './rateLimiter';

export const compressionMiddleware: RequestHandler = compression;
export const rateLimiterMiddleware: RequestHandler = rateLimiter;