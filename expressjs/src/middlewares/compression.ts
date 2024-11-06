import { Request, Response } from 'express';
import compression from 'compression';
export const compressionMiddleware = compression({
    level: 6, // Set compression level from 0 (no compression) to 9 (maximum compression)
    threshold: 0,// Compress all responses, regardless of their size
    filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
            // don't compress responses if this request header is present
            return false;
        }
        // fallback to standard filter function
        return compression.filter(req, res);
    }
})