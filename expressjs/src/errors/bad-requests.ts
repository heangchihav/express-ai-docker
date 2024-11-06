import { ErrorCode, HttpError } from "./root";

export class BadRequestsError extends HttpError {
    constructor(message: string, errorCode: ErrorCode, originalError?: any) {
        super(message, errorCode, originalError);
    }
}