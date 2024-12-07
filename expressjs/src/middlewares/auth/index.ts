import { RequestHandler } from 'express';
import { adminMiddleware as admin } from './admin';
import { allowDeviceMiddleware as allowDevice } from './allowDevice';
import { authMiddleware as auth } from './auth';
import { sessionMiddleware as session } from './session';

export const adminMiddleware: RequestHandler = admin;
export const allowDeviceMiddleware: RequestHandler = allowDevice;
export const authMiddleware: RequestHandler = auth;
export const sessionMiddleware: RequestHandler = session;