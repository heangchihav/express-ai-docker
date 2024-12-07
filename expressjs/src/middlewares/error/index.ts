import { ErrorRequestHandler, RequestHandler } from 'express';
import { errorHandler } from './errorHandler';
import { notFoundHandler } from './globleErrorMiddleware';

export const errorHandlerMiddleware: ErrorRequestHandler = errorHandler;
export const notFoundHandlerMiddleware: RequestHandler = notFoundHandler;
export const errors: RequestHandler = require('./errors').default;