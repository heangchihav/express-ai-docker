import { type Request, type Response, Router } from 'express'
import passport from 'passport';
import { secret } from '../config/secret';

const googleAuthRoutes: Router = Router();


// Redirect to Google for authentication
googleAuthRoutes.get('/google', passport.authenticate('google', { scope: ['openid', 'profile', 'email'], session: false }));

// Google auth callback
googleAuthRoutes.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }),
    (req: Request, res: Response) => {
        // Successful authentication
        const accessToken = req.authInfo?.accessToken;
        const refreshToken = req.authInfo?.refreshToken;
        // For web clients, set the refresh token in a secure cookie
        res.cookie("refreshToken", `Bearer ${refreshToken}`, {
            httpOnly: true,
            secure: secret.NODE_ENV === 'production', // set to true if using https
            sameSite: "strict", // adjust according to your needs
        });
        //For mobile clients, send the refresh token in the response body
        //The mobile app should handle storing this token securely
        res.json({
            accessToken: `Bearer ${accessToken}`, // for both web and mobile
            refreshToken: req.body.isMobile ? `Bearer ${refreshToken}` : undefined, // only send if the client is mobile
        });
        res.redirect('/');
    }
);

export default googleAuthRoutes;