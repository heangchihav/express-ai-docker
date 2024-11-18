import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError, ErrorCode, isHttpError, handleZodError } from '../errors/root';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import Logger from '../config/logger';

// Error handling middleware
export const errorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error
    Logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: req.path
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const httpError = handleZodError(error);
        return res.status(httpError.statusCode).json(httpError.toResponse());
    }

    // Handle known Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
        const httpError = handlePrismaError(error);
        return res.status(httpError.statusCode).json(httpError.toResponse());
    }

    // Handle known HTTP errors
    if (isHttpError(error)) {
        return res.status(error.statusCode).json(error.toResponse());
    }

    // Handle 404 errors
    if (error.message === 'Not Found') {
        const httpError = new HttpError(
            'Resource not found',
            ErrorCode.RECORD_NOT_FOUND
        );
        return res.status(httpError.statusCode).json(httpError.toResponse());
    }

    // Handle all other errors
    const httpError = new HttpError(
        'Internal server error',
        ErrorCode.INTERNAL_SERVER_ERROR,
        process.env.NODE_ENV === 'development' ? error : undefined
    );

    return res.status(httpError.statusCode).json(httpError.toResponse());
};

function handlePrismaError(error: PrismaClientKnownRequestError): HttpError {
    switch (error.code) {
        case 'P2002':
            return new HttpError(
                'A record with this value already exists',
                ErrorCode.DUPLICATE_ENTRY,
                { field: error.meta?.target }
            );
        case 'P2025':
            return new HttpError(
                'Record not found',
                ErrorCode.RECORD_NOT_FOUND
            );
        default:
            return new HttpError(
                'Database error occurred',
                ErrorCode.DATABASE_ERROR,
                process.env.NODE_ENV === 'development' ? error : undefined
            );
    }
}