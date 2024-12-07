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
    // Authentication & Authorization
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
    USERNAME_EXISTS = 'USERNAME_EXISTS',
    
    // Resource Errors
    NOT_FOUND = 'NOT_FOUND',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
    BAD_REQUEST = 'BAD_REQUEST',
    
    // Server Errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    
    // Rate Limiting
    TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
    
    // Security
    CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
    CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
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
        switch (errorCode) {
            case ErrorCode.UNAUTHORIZED:
            case ErrorCode.FORBIDDEN:
            case ErrorCode.INVALID_TOKEN:
            case ErrorCode.TOKEN_EXPIRED:
                this.statusCode = 401; // Authentication errors
                break;
            case ErrorCode.VALIDATION_ERROR:
            case ErrorCode.NOT_FOUND:
            case ErrorCode.DUPLICATE_ENTRY:
            case ErrorCode.UNPROCESSABLE_ENTITY:
            case ErrorCode.BAD_REQUEST:
                this.statusCode = 400; // Resource errors
                break;
            case ErrorCode.INTERNAL_SERVER_ERROR:
            case ErrorCode.INTERNAL_ERROR:
            case ErrorCode.DATABASE_ERROR:
            case ErrorCode.SERVICE_UNAVAILABLE:
                this.statusCode = 500; // Server errors
                break;
            case ErrorCode.TOO_MANY_REQUESTS:
                this.statusCode = 429; // Rate limiting
                break;
            case ErrorCode.CSRF_TOKEN_MISSING:
            case ErrorCode.CSRF_TOKEN_INVALID:
            case ErrorCode.SUSPICIOUS_ACTIVITY:
                this.statusCode = 403; // Security
                break;
            default:
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
