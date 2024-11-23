import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { hash } from "bcryptjs";
import { BadRequestsError } from "../errors/bad-requests";
import { ErrorCode } from "../errors/root";
import { SignUpSchema } from "../schema/signUp";
import { generateAccessToken } from "../helpers/generateAccessToken";
import { generateRefreshToken } from "../helpers/generateRefreshToken";
import { secret } from "../config/secret";

/**
 * @method POST
 * @path /api/auth/signup
 */
export const signup = async (req: Request, res: Response) => {
  try {
    SignUpSchema.parse(req.body);
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: username },
    });

    if (existingUser) {
      throw new BadRequestsError(
        "Username already exists",
        ErrorCode.USERNAME_EXISTS
      );
    }

    // Use a consistent salt rounds value and handle bcrypt more efficiently
    const SALT_ROUNDS = 10;
    const passwordHash = await hash(password, SALT_ROUNDS);

    // Create new user with transaction
    const result = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role: "USER",
        },
      });

      const refreshTokenRecord = await prisma.refreshToken.create({
        data: {
          userId: newUser.id,
        },
      });

      return { newUser, refreshTokenRecord };
    });

    const accessToken = generateAccessToken(result.newUser);
    const refreshToken = generateRefreshToken(result.refreshTokenRecord);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", `Bearer ${refreshToken}`, {
      httpOnly: true,
      secure: secret.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.status(201).json({
      message: "User created successfully",
      accessToken: `Bearer ${accessToken}`,
      refreshToken: req.body.isMobile ? `Bearer ${refreshToken}` : undefined,
    });
  } catch (error) {
    throw error;
  }
};
