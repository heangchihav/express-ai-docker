import * as jwt from 'jsonwebtoken';
import { secret } from '../config/secret';


export const generateAccessToken = (foundUser: any) => {
    return jwt.sign({ userId: foundUser.id }, secret.accessTokenSecret, {
        expiresIn: "1m",
    });
};
