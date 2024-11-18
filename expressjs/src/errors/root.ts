import { ZodError } from 'zod';

export interface ErrorResponse {
    message: string;
    errorCode: ErrorCode;
    statusCode: number;
    errors?: any;
    timestamp: string;
    path?: string;
    stack?: string;
}

export enum ErrorCode {
    // Authentication Errors (1000-1999)
    INVALID_CREDENTIALS = 1000,
    TOKEN_EXPIRED = 1001,
    INVALID_TOKEN = 1002,
    UNAUTHORIZED = 1003,
    USERNAME_EXISTS = 1004,
    USER_NOT_FOUND = 1005,
    INCORRECT_PASSWORD = 1006,
    FORBIDDEN = 1007,

    // Validation Errors (2000-2999)
    VALIDATION_ERROR = 2000,
    INVALID_INPUT = 2001,
    MISSING_REQUIRED_FIELD = 2002,
    UNPROCESSABLE_ENTITY = 2003,

    // Database Errors (3000-3999)
    DATABASE_ERROR = 3000,
    RECORD_NOT_FOUND = 3001,
    DUPLICATE_ENTRY = 3002,

    // Server Errors (5000-5999)
    INTERNAL_SERVER_ERROR = 5000,
    SERVICE_UNAVAILABLE = 5001,
    NOT_FOUND = 5002,
    INTERNAL_ERROR = 5003
}

export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: ErrorCode;
    public readonly errors?: any;
    public readonly path?: string;

    constructor(message: string, errorCode: ErrorCode, errors?: any) {
        super(message);
        this.name = this.constructor.name;
        this.errorCode = errorCode;
        this.errors = errors;

        // Set HTTP status code based on error code range
        const code = Number(errorCode);
        if (code >= 1000 && code <= 1999) {
            this.statusCode = 401; // Authentication errors
            if (errorCode === ErrorCode.FORBIDDEN) {
                this.statusCode = 403;
            }
        } else if (code >= 2000 && code <= 2999) {
            this.statusCode = 400; // Validation errors
            if (errorCode === ErrorCode.UNPROCESSABLE_ENTITY) {
                this.statusCode = 422;
            }
        } else if (code >= 3000 && code <= 3999) {
            this.statusCode = 404; // Database errors
        } else if (code >= 5000 && code <= 5999) {
            this.statusCode = 500; // Server errors
        } else {
            this.statusCode = 500; // Default to server error
        }

        Error.captureStackTrace(this, this.constructor);
    }

    public toResponse(includeStack = false): ErrorResponse {
        const response: ErrorResponse = {
            message: this.message,
            errorCode: this.errorCode,
            statusCode: this.statusCode,
            timestamp: new Date().toISOString()
        };

        if (this.errors) {
            response.errors = this.errors;
        }

        if (this.path) {
            response.path = this.path;
        }

        if (includeStack && this.stack) {
            response.stack = this.stack;
        }

        return response;
    }
}

// Type guard for HttpError
export function isHttpError(error: any): error is HttpError {
    return error instanceof HttpError;
}

export function handleZodError(error: ZodError): HttpError {
    return new HttpError(
        'Validation failed',
        ErrorCode.VALIDATION_ERROR,
        error.errors
    );
}
