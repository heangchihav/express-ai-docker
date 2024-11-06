import { NextFunction, Request, Response } from "express";
import { hashSync } from "bcrypt";
import { BadRequestsError } from "../errors/bad-requests";
import { ErrorCode } from "../errors/root";
import { SignUpSchema } from "../schema/signUp";
import prisma from "../libs/prisma";

/**
 *@method POST
 *@path /api/auth/signup
 */

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  SignUpSchema.parse(req.body);
  const { username, password } = req.body;

  const foundUser = await prisma.user.findFirst({
    where: { username: username },
  });
  if (foundUser) {
    throw new BadRequestsError(
      "User already exists!",
      ErrorCode.USER_ALREADY_EXISTS
    );
  }
  const newUser = await prisma.user.create({
    data: {
      username: username,
      passwordHash: hashSync(password, 10),
    },
  });
  res.json(newUser);
};
