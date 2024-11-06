import { NextFunction, Request, Response } from "express";
import passport from "passport";

// List of routes that do not require authentication
const excludedRoutes = [
  "/api/csrf-token",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/refresh",
];

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if the current route is in the excluded list
  if (excludedRoutes.includes(req.path)) {
    return next(); // Skip authentication for this route
  }

  // Apply JWT authentication for all other routes
  return passport.authenticate("jwt", { session: false })(req, res, next);
};

export default authMiddleware;
