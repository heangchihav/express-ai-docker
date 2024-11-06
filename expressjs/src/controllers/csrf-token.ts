import { Request, Response } from "express";

// Route to get CSRF token
const csrfToken = (req: Request, res: Response) => {
    const csrfToken = req.csrfToken()
    // Send the CSRF token to the client
    res.json({ csrfToken: csrfToken, });
};
export default csrfToken;