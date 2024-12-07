import { Router } from 'express';
import { logout } from '../controllers/logout';

const logoutRoutes: Router = Router();

logoutRoutes.get('/logout', logout);

export default logoutRoutes;