import { HttpError, ErrorCode } from './root';

export class CsrfError extends HttpError {
    constructor(message: string, errorCode: ErrorCode, originalError?: any) {
        super(message, errorCode, originalError);
        this.name = this.constructor.name;
    }
}
