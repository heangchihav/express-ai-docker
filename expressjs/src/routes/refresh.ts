import { Router } from 'express'
import { refresh } from '../controllers/refresh';
import { asyncErrorHandler } from '../middlewares/error/ErrorMiddleware';
const refreshRoutes: Router = Router();

refreshRoutes.post('/refresh', asyncErrorHandler(refresh));

export default refreshRoutes;