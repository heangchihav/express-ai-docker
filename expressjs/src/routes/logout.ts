import { Router } from 'express';
import { logout } from '../controllers/logout';
import { asyncErrorHandler } from '../middlewares/error/ErrorMiddleware';

const logoutRoutes: Router = Router();

logoutRoutes.get('/logout', asyncErrorHandler(logout));

export default logoutRoutes;