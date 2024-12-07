import { Router, Request, Response } from 'express'
import { errorHandler } from '../middlewares/error/errorHandler';
import csrfToken from '../controllers/csrf-token';

const csrfTokenRoutes: Router = Router();

// Convert the handler to async
csrfTokenRoutes.post('/csrf-token', errorHandler(async (req: Request, res: Response) => {
    await csrfToken(req, res);
}));

export default csrfTokenRoutes;