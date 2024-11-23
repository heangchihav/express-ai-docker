import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { secret } from '../config/secret';
import Logger from '../config/logger';

const prisma = new PrismaClient();

interface JwtPayload {
    userId: number;
    iat?: number;
    exp?: number;
}

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret.accessTokenSecret,
    algorithms: ['HS256'] as const
};

type DoneFunction = (error: any, user?: any, info?: any) => void;

passport.use(
    new JwtStrategy(options as any, async (jwt_payload: JwtPayload, done: DoneFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: jwt_payload.userId }
            });

            if (user) {
                Logger.debug('JWT Strategy: User found', {
                    userId: user.id,
                    email: user.email
                });
                return done(null, user);
            }

            Logger.warn('JWT Strategy: User not found', {
                userId: jwt_payload.userId
            });
            return done(null, false);
        } catch (error) {
            Logger.error('JWT Strategy: Error', { error });
            return done(error as Error, false);
        }
    })
);
