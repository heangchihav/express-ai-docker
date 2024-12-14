import { Router } from 'express'
import { signup } from '../controllers/signup'
import { login } from '../controllers/login'
import googleAuthRoutes from './google';
import { asyncErrorHandler } from '../middlewares/error/ErrorMiddleware';
const authRoutes: Router = Router();

authRoutes.post('/signup', asyncErrorHandler(signup));
authRoutes.post('/login', asyncErrorHandler(login));
authRoutes.use(googleAuthRoutes);
export default authRoutes;