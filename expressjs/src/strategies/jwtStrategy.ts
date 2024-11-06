import passport from "passport";
import { secret } from "../config/secret";
import prisma from "../libs/prisma";
import { JwtPayload } from "jsonwebtoken";
import { VerifiedCallback } from "passport-jwt";

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret.ACCESS_TOKEN_SECRET,
};

const verify = async (payload: JwtPayload, done: VerifiedCallback) => {
  const userId = payload.userId;
  try {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      return done(null, false);
    }
    if (user) {
      return done(null, user);
    }
  } catch (error) {
    return done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(options, verify);

passport.use(jwtStrategy);
