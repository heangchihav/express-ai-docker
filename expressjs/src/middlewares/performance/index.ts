import { compressionMiddleware as compression } from './compression';
import { rateLimiterMiddleware as rateLimiter } from './rateLimiter';
import { MiddlewareFunction } from 'src/types/middleware';

export const compressionMiddleware: MiddlewareFunction = compression;
export const rateLimiterMiddleware: MiddlewareFunction = rateLimiter;