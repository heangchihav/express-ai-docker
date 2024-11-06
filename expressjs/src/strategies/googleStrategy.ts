import passport from "passport";
import { secret } from "../config/secret";
import prisma from "../libs/prisma";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { generateAccessToken } from "../helpers/generateAccessToken";
import { generateRefreshToken } from "../helpers/generateRefreshToken";

const options = {
  clientID: secret.GOOGLE_CLIENT_ID,
  clientSecret: secret.GOOGLE_CLIENT_SECRET,
  callbackURL: secret.CALL_BACK_URL,
};

const verify = async (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  cb: VerifyCallback
) => {
  try {
    // Find or create a user in the database
    const foundUser = await prisma.user.upsert({
      where: { googleId: profile.id },
      create: {
        googleId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        // Add any other fields you want to save from the profile
      },
      update: {
        // Update any fields if necessary
      },
    });

    const accessToken = generateAccessToken(foundUser);
    const hashedRefreshToken = await prisma.refreshToken.create({
      data: {
        userId: foundUser.id,
      },
    });
    const refreshToken = generateRefreshToken(hashedRefreshToken);
    return cb(null, foundUser, { accessToken, refreshToken });
  } catch (err) {
    return cb(err);
  }
};
passport.use(new GoogleStrategy(options, verify));
