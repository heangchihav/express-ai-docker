import { Router } from 'express'
import { errorHandler } from '../error-handler';
import csrfToken from '../controllers/csrf-token';
const csrfTokenRoutes: Router = Router();

csrfTokenRoutes.get('/csrf-token',  errorHandler(csrfToken));

export default csrfTokenRoutes;