import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/unauthorized";
import { ErrorCode } from "../errors/root";
import { User } from "@prisma/client";

const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (user.role == 'ADMIN') {
        next();
    }
    else {
        next(new UnauthorizedError('Unauthorized', ErrorCode.UNAUTHORIZED));
    }
};

export default adminMiddleware;