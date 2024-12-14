import { Router, Request, Response } from 'express'
import { asyncErrorHandler } from '../middlewares/error/ErrorMiddleware';
import csrfToken from '../controllers/csrf-token';

const csrfTokenRoutes: Router = Router();

// Convert the handler to async
csrfTokenRoutes.post('/csrf-token', asyncErrorHandler(async (req: Request, res: Response) => {
    await csrfToken(req, res);
}));

export default csrfTokenRoutes;