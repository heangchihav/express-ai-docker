import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { compareSync } from "bcrypt";
import { BadRequestsError } from "../errors/bad-requests";
import { ErrorCode } from "../errors/root";
import { NotFoundError } from "../errors/not-found";
import { LoginSchema } from "../schema/login";
import { generateAccessToken } from "../helpers/generateAccessToken";
import { generateRefreshToken } from "../helpers/generateRefreshToken";
import { secret } from "../config/secret";

/**
 *@method POST
 *@path /api/auth/login
 */

export const login = async (req: Request, res: Response) => {
  LoginSchema.parse(req.body);
  const { username, password } = req.body;
  const foundUser = await prisma.user.findFirst({
    where: { username: username },
  });
  if (!foundUser) {
    throw new NotFoundError("User not found.", ErrorCode.USER_NOT_FOUND);
  }
  if (!compareSync(password, foundUser.passwordHash!)) {
    throw new BadRequestsError(
      "Incorrect password",
      ErrorCode.INCORRECT_PASSWORD
    );
  }
  const accessToken = generateAccessToken(foundUser);
  const hashedRefreshToken = await prisma.refreshToken.create({
    data: {
      userId: foundUser.id,
    },
  });
  const refreshToken = generateRefreshToken(hashedRefreshToken);

  // For web clients, set the refresh token in a secure cookie
  res.cookie("refreshToken", `Bearer ${refreshToken}`, {
    httpOnly: true,
    secure: secret.NODE_ENV === "production", // set to true if using https
    sameSite: "strict", // adjust according to your needs
  });
  //For mobile clients, send the refresh token in the response body
  //The mobile app should handle storing this token securely
  res.json({
    accessToken: `Bearer ${accessToken}`, // for both web and mobile
    refreshToken: req.body.isMobile ? `Bearer ${refreshToken}` : undefined, // only send if the client is mobile
  });
};
