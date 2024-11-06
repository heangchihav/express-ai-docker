import { ErrorCode, HttpError } from "./root";

export class NotFoundError extends HttpError {
    constructor(message: string, errorCode: ErrorCode, originalError?: any) {
        super(message, errorCode, originalError);
    }
}