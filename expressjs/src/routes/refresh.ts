import { Router } from 'express'
import { refresh } from '../controllers/refresh';
import { errorHandler } from '../middlewares/error/errorHandler';
const refreshRoutes: Router = Router();

refreshRoutes.post('/refresh', errorHandler(refresh));

export default refreshRoutes;