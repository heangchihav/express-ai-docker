import { NextFunction, Request, Response } from "express";
import { ErrorCode } from "../../errors/root";
import passport from "passport";

// List of routes that do not require authentication
const excludedRoutes = [
  "/api/csrf-token",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/refresh",
  "/api/healthcheck",
  "/api/test-fastapi"
];

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if the current route is in the excluded list
  if (excludedRoutes.includes(req.path)) {
    return next(); // Skip authentication for this route
  }

  const auth = passport.authenticate('jwt', { session: false }, (error: any, user: any, info: any) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        message: "You must be logged in to access this resource",
        code: ErrorCode.UNAUTHORIZED
      });
    }

    req.user = user;
    next();
  });

  auth(req, res, next);
};