import jwt from 'jsonwebtoken'
import { secret } from '../config/secret';
export const generateRefreshToken = (hashedRefreshToken: any) => {
    return jwt.sign({ refreshToken: hashedRefreshToken.id }, secret.REFRESH_TOKEN_SECRET, {
        expiresIn: "365d",
    });
}