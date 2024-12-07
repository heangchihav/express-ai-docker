import { RequestHandler } from 'express';
import { logRequest } from './logRequest';
import { morganMiddleware as morgan } from './morgan';

export const logRequestMiddleware: RequestHandler = logRequest;
export const morganMiddleware: RequestHandler = morgan;
