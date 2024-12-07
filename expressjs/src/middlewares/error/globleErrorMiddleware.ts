import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../errors/root';
import Logger from '../../config/logger';

// Global error handler middleware
export const errorHandler = (
    error: Error | HttpError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log the error
    Logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle known HTTP errors
    if (error instanceof HttpError) {
        res.status(error.statusCode).json({
            status: 'error',
            code: error.statusCode,
            message: error.message
        });
        return;
    }

    // Handle validation errors (e.g., from express-validator)
    if (error.name === 'ValidationError') {
        res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Validation failed',
            errors: error.message
        });
        return;
    }

    // Handle database errors
    if (error.name === 'PrismaClientKnownRequestError' || 
        error.name === 'PrismaClientValidationError') {
        res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Database operation failed'
        });
        return;
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || 
        error.name === 'TokenExpiredError') {
        res.status(401).json({
            status: 'error',
            code: 401,
            message: 'Invalid or expired token'
        });
        return;
    }

    // Handle unknown errors
    res.status(500).json({
        status: 'error',
        code: 500,
        message: 'Internal Server Error'
    });
};

// 404 handler middleware
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    Logger.warn('Route not found:', {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(404).json({
        status: 'error',
        code: 404,
        message: `Route ${req.path} not found`
    });
};
