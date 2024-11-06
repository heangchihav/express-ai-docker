import { Request, Response, NextFunction } from "express";
import { ErrorCode, HttpError } from "./errors/root";
import { InternalError } from "./errors/internal-error";
import { ZodError } from "zod";
import { BadRequestsError } from "./errors/bad-requests";
import { CsrfError } from "./errors/CsrfError";

export const errorHandler = (method: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await method(req, res, next);
        } catch (error: any) {
            let Error: HttpError;

            if (error instanceof HttpError) {
                Error = error; // Use the thrown HttpError directly
            } else {
                // Handle different types of errors
                if (error instanceof ZodError) {
                    Error = new BadRequestsError('Unprocessable entity.', ErrorCode.UNPROCESSABLE_ENTITY, error);
                } else if (error.code === 'EBADCSRFTOKEN') {
                    Error = new CsrfError('Invalid CSRF token.', ErrorCode.FORBIDDEN, error);
                } else {
                    Error = new InternalError('Something went wrong!', ErrorCode.INTERNAL_ERROR, error);
                }
            }

            // Pass the constructed HttpError to the next middleware
            next(Error);
        }
    };
};
