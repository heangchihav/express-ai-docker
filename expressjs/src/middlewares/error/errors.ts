import { Request, Response, NextFunction } from 'express';
import { HttpError, ErrorCode } from '../../errors/root';
import { 
    ValidationError, 
    DatabaseError, 
    InternalServerError 
} from '../../errors/http';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import Logger from '../../config/logger';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log the error
    Logger.error({
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });

    // Handle HttpError (our custom error class)
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            status: 'error',
            code: error.errorCode,
            message: error.message,
            errors: error.errors,
        });
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const dbError = new DatabaseError('Database operation failed');
        dbError.errors = error.meta ? [error.meta] : undefined;

        switch (error.code) {
            case 'P2002': // Unique constraint violation
                dbError.message = 'A record with this value already exists';
                break;
            case 'P2025': // Record not found
                dbError.message = 'Record not found';
                break;
            // Add more Prisma error codes as needed
        }

        return res.status(dbError.statusCode).json({
            status: 'error',
            code: dbError.errorCode,
            message: dbError.message,
            errors: dbError.errors,
        });
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const validationError = new ValidationError('Validation failed', 
            error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
            }))
        );

        return res.status(validationError.statusCode).json({
            status: 'error',
            code: validationError.errorCode,
            message: validationError.message,
            errors: validationError.errors,
        });
    }

    // Handle other errors
    const serverError = new InternalServerError();
    if (process.env.NODE_ENV === 'development') {
        serverError.errors = [error.message];
    }

    return res.status(serverError.statusCode).json({
        status: 'error',
        code: serverError.errorCode,
        message: serverError.message,
        errors: serverError.errors,
    });
};