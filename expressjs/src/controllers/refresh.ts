import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { secret } from "../config/secret";
import jwt from "jsonwebtoken";
import { CustomJwtPayload } from "../types/CustomJwtPayload";
import { generateRefreshToken } from "../helpers/generateRefreshToken";

/**
 * @method POST
 * @path /api/refresh
 * @description Refreshes the access token and optionally updates the refresh token.
 */
export const refresh = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Retrieve the refresh token from cookies or headers
  const refreshToken = req.cookies.refreshToken || req.get("refreshtoken");

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  // Extract the token value if it includes the 'Bearer ' prefix
  const tokenValue = refreshToken.startsWith("Bearer ")
    ? refreshToken.split(" ")[1]
    : refreshToken;

  // Verify the refresh token
  const decodedToken = jwt.verify(
    tokenValue,
    secret.REFRESH_TOKEN_SECRET
  ) as CustomJwtPayload;

  // Fetch the associated user from the database
  const userRefreshToken = await prisma.refreshToken.findUnique({
    where: { id: decodedToken.refreshToken },
  });

  if (!userRefreshToken) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  // Remove the old refresh token
  await prisma.refreshToken.delete({
    where: { id: userRefreshToken.id },
  });

  // Generate a new access token
  const newAccessToken = jwt.sign(
    { userId: userRefreshToken.userId },
    secret.ACCESS_TOKEN_SECRET,
    { expiresIn: "1m" }
  );

  // Create a new refresh token and generate its value
  const newRefreshTokenEntry = await prisma.refreshToken.create({
    data: { userId: userRefreshToken.userId },
  });

  const newRefreshToken = generateRefreshToken(newRefreshTokenEntry);
  const csrfToken = req.csrfToken();

  // Set the new refresh token in a secure cookie
  res.cookie("refreshToken", `Bearer ${newRefreshToken}`, {
    httpOnly: true,
    secure: secret.NODE_ENV === "production", // Use true if using https
    sameSite: "strict", // Adjust according to your needs
  });

  // Respond with the new tokens
  return res.json({
    accessToken: `Bearer ${newAccessToken}`, // Provided for both web and mobile
    refreshToken: req.body.isMobile ? `Bearer ${newRefreshToken}` : undefined, // Include only for mobile clients
    csrfToken: csrfToken,
  });
};
