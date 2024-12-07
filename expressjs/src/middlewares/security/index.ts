import { RequestHandler } from 'express';
import { corsMiddleware as cors } from './cors';
import { csrfProtection as csrf } from './csrf';
import { customSecurityMiddleware as customSecurity } from './customSecurity';
import { helmetSecurityMiddleware as helmet } from './helmet';
import { sqlInjectionCheckMiddleware as sqlInjectionCheck } from './sqlInjectionCheck';

export const corsMiddleware: RequestHandler = cors;
export const csrfProtection: RequestHandler = csrf;
export const customSecurityMiddleware: RequestHandler = customSecurity;
export const helmetSecurityMiddleware: RequestHandler = helmet;
export const sqlInjectionCheckMiddleware: RequestHandler = sqlInjectionCheck;
