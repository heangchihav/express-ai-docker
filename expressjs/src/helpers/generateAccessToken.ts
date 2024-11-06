import * as jwt from 'jsonwebtoken';
import { secret } from '../config/secret';


export const generateAccessToken = (foundUser: any) => {
    return jwt.sign({ userId: foundUser.id }, secret.ACCESS_TOKEN_SECRET, {
        expiresIn: "1m",
    });
};
