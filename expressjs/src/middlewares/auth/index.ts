import { adminMiddleware as admin } from './admin';
import { allowDeviceMiddleware as allowDevice } from './allowDevice';
import { authMiddleware as auth } from './auth';
import { sessionMiddleware as session } from './session';
import { MiddlewareFunction } from 'src/types/middleware';

export const adminMiddleware: MiddlewareFunction = admin;
export const allowDeviceMiddleware: MiddlewareFunction = allowDevice;
export const authMiddleware: MiddlewareFunction = auth;
export const sessionMiddleware: MiddlewareFunction = session;