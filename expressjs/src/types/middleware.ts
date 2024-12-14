import { NextFunction } from "express";

export type MiddlewareFunction = (
    req: Request | any,
    res: Response | any,
    next: NextFunction
  ) => void | Promise<void>;