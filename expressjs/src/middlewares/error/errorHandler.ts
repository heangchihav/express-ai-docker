import { Request, Response, NextFunction } from "express";
import { ErrorCode, HttpError } from "../../errors/root";
import { InternalError } from "../../errors/internal-error";
import { ZodError } from "zod";
import { BadRequestsError } from "../../errors/bad-requests";
import { CsrfError } from "../../errors/CsrfError";
import Logger from "../../config/logger";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Higher-order function that wraps route handlers to provide consistent error handling
 * @param handler - The async route handler function to wrap
 * @returns A middleware function that handles errors uniformly
 */
export const errorHandler = (handler: AsyncRequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await handler(req, res, next);
        } catch (error: unknown) {
            Logger.error('Route error caught:', {
                path: req.path,
                method: req.method,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
            });

            // Convert the error to an HttpError instance
            const httpError = mapErrorToHttpError(error);
            
            // Pass to global error handler
            next(httpError);
        }
    };
};

/**
 * Maps different types of errors to appropriate HttpError instances
 * @param error - The caught error
 * @returns An appropriate HttpError instance
 */
function mapErrorToHttpError(error: unknown): HttpError {
    // If it's already an HttpError, return it directly
    if (error instanceof HttpError) {
        return error;
    }

    // Handle specific error types
    if (error instanceof ZodError) {
        return new BadRequestsError(
            'Validation failed',
            ErrorCode.UNPROCESSABLE_ENTITY,
            {
                details: error.errors,
                message: error.message
            }
        );
    }

    if (error && typeof error === 'object' && 'code' in error) {
        // Handle CSRF token errors
        if (error.code === 'EBADCSRFTOKEN') {
            return new CsrfError(
                'Invalid or missing CSRF token',
                ErrorCode.FORBIDDEN,
                error
            );
        }
    }

    // Handle unknown errors
    return new InternalError(
        'An unexpected error occurred',
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error : new Error('Unknown error')
    );
}
