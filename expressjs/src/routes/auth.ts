import { Router } from 'express'
import { signup } from '../controllers/signup'
import { login } from '../controllers/login'
import googleAuthRoutes from './google';
import { errorHandler } from '../error-handler';
const authRoutes: Router = Router();

authRoutes.post('/signup',errorHandler(signup) );
authRoutes.post('/login', errorHandler(login));
authRoutes.use(googleAuthRoutes);
export default authRoutes;