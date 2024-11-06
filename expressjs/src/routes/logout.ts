import { Router } from 'express'
import { errorHandler } from '../error-handler'
import { logout } from '../controllers/logout';
import authMiddleware from '../middlewares/auth';

const logoutRoutes: Router = Router();

logoutRoutes.get('/logout', authMiddleware, errorHandler(logout));

export default logoutRoutes;