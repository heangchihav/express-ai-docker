import { corsMiddleware as cors } from './cors';
import { csrfProtection as csrf } from './csrf';
import { customSecurityMiddleware as customSecurity } from './customSecurity';
import { helmetSecurityMiddleware as helmet } from './helmet';
import { sqlInjectionCheckMiddleware as sqlInjectionCheck } from './sqlInjectionCheck';
import { MiddlewareFunction } from 'src/types/middleware';


export const corsMiddleware: MiddlewareFunction = cors;
export const csrfProtection: MiddlewareFunction = csrf;
export const customSecurityMiddleware: MiddlewareFunction = customSecurity;
export const helmetSecurityMiddleware: MiddlewareFunction = helmet;
export const sqlInjectionCheckMiddleware: MiddlewareFunction = sqlInjectionCheck;
