export class HttpError extends Error {
    public statusCode: number;
    public errorCode: ErrorCode;
    public errors?: any;

    constructor(message: string, errorCode: ErrorCode, errors?: any) {
        super(message);
        this.name = this.constructor.name;
        this.errorCode = errorCode;
        this.errors = errors;

        // Set statusCode based on errorCode using getStatusCode method
        this.statusCode = this.getStatusCode(errorCode);
    }

    private getStatusCode(errorCode: ErrorCode): number {
        switch (errorCode) {
            case ErrorCode.FORBIDDEN:
                return 403;
            case ErrorCode.UNPROCESSABLE_ENTITY:
                return 422;
            case ErrorCode.INTERNAL_ERROR:
                return 500;
            // Add more cases as needed
            default:
                return 500; // Default to Internal Server Error
        }
    }
}


export enum ErrorCode {
    FORBIDDEN = 'FORBIDDEN',
    USER_NOT_FOUND = 1001,
    USER_ALREADY_EXISTS = 1002,
    INCORRECT_PASSWORD = 1003,
    ADDRESS_NOT_FOUND = 1004,
    ADDRESS_DOES_NOT_BELONG = 1005,
    UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UNAUTHORIZED = 4001,
    PRODUCT_NOT_FOUND = 5001,
    ORDER_NOT_FOUND = 6001,
    // Add more error codes as needed
}
