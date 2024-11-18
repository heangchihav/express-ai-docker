import { HttpError, ErrorCode } from './root';

export class SignupError extends HttpError {
    constructor(message: string, errorCode: ErrorCode, errors?: any) {
        super(message, errorCode, errors);
        this.name = 'SignupError';
    }

    static usernameExists(username: string) {
        return new SignupError(
            `Username '${username}' is already taken`,
            ErrorCode.USERNAME_EXISTS,
            { field: 'username' }
        );
    }

    static invalidPassword() {
        return new SignupError(
            'Password does not meet security requirements',
            ErrorCode.VALIDATION_ERROR,
            { field: 'password' }
        );
    }

    static invalidUsername() {
        return new SignupError(
            'Username contains invalid characters',
            ErrorCode.VALIDATION_ERROR,
            { field: 'username' }
        );
    }

    static databaseError(originalError: any) {
        return new SignupError(
            'Error creating user account',
            ErrorCode.DATABASE_ERROR,
            originalError
        );
    }
}
