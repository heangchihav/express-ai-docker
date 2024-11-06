import { Router } from 'express'
import { refresh } from '../controllers/refresh';
import { errorHandler } from '../error-handler';
const refreshRoutes: Router = Router();

refreshRoutes.post('/refresh', errorHandler(refresh));

export default refreshRoutes;