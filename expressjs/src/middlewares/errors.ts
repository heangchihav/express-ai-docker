import { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/root";


// Error handling middleware
export const errorMiddleware = (error: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = error.statusCode || 500; // Default to 500 if statusCode is undefined

    // Log the error for debugging purposes
    console.error(`Status code: ${statusCode}, Message: ${error.message}`);

    res.status(statusCode).json({
        message: error.message || 'Internal Server Error', // Default message if undefined
        errorCode: error.errorCode || 'UNKNOWN_ERROR', // Default error code if undefined
        errors: error.errors || [] // Default to empty array if undefined
    });
};