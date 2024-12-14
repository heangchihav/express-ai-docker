import { logRequest } from './logRequest';
import { morganMiddleware as morgan } from './morgan';
import { MiddlewareFunction } from 'src/types/middleware';

export const logRequestMiddleware: MiddlewareFunction = logRequest;
export const morganMiddleware: MiddlewareFunction = morgan;
