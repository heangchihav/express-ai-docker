import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { PrismaClient, User, Role } from '@prisma/client';
import { secret } from '../config/secret';
import Logger from '../config/logger';

const prisma = new PrismaClient();

// Google OAuth Strategy
const googleStrategyConfig = {
    clientID: secret.googleClientId,
    clientSecret: secret.googleClientSecret,
    callbackURL: secret.googleCallbackUrl,
    scope: ['profile', 'email']
};

passport.use(
    new GoogleStrategy(
        googleStrategyConfig,
        async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            try {
                // Check if user exists
                const existingUser = await prisma.user.findFirst({
                    where: { 
                        OR: [
                            { email: profile.emails?.[0]?.value },
                            { googleId: profile.id }
                        ]
                    }
                });

                if (existingUser) {
                    Logger.debug('Google Strategy: Existing user found', {
                        userId: existingUser.id,
                        email: existingUser.email
                    });
                    return done(null, existingUser);
                }

                // Create new user if doesn't exist
                const newUser = await prisma.user.create({
                    data: {
                        email: profile.emails?.[0]?.value || null,
                        name: profile.displayName || null,
                        googleId: profile.id,
                        role: Role.USER,
                        username: profile.emails?.[0]?.value?.split('@')[0] || null
                    }
                });

                Logger.info('Google Strategy: New user created', {
                    userId: newUser.id,
                    email: newUser.email
                });

                return done(null, newUser);
            } catch (error) {
                Logger.error('Google Strategy: Error', { error });
                return done(error as Error, undefined);
            }
        }
    )
);

// Serialize user for the session
passport.serializeUser((user: any, done) => {
    const typedUser = user as User;
    Logger.debug('Serializing user', { userId: typedUser.id });
    done(null, typedUser.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (user) {
            Logger.debug('Deserialized user found', { userId: user.id });
            done(null, user);
        } else {
            Logger.warn('Deserialized user not found', { userId: id });
            done(new Error('User not found'), null);
        }
    } catch (error) {
        Logger.error('Error deserializing user', { error });
        done(error as Error, null);
    }
});
