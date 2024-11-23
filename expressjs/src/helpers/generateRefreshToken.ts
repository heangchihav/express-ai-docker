import jwt from 'jsonwebtoken'
import { secret } from '../config/secret';
export const generateRefreshToken = (hashedRefreshToken: any) => {
    return jwt.sign({ refreshToken: hashedRefreshToken.id }, secret.refreshTokenSecret, {
        expiresIn: "365d",
    });
}