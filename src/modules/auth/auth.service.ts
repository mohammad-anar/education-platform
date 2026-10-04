import { UserStatus } from "@prisma/client";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { jwtHelper } from "../../utils/jwt.js";
import { emailHelper, emailTemplates } from "../../utils/email.js";
import cacheHelper from "../../utils/cache.js";
import cryptoHelper from "../../utils/crypto.js";
import {
  IChangePassword,
  IForgotPassword,
  ILoginUser,
  IRefreshToken,
  IRegisterUser,
  IResetPassword,
  ISendOtp,
  IVerifyOtp,
} from "./auth.interface.js";

const userSelectedFields = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  displayName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  status: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  lastLoginAt: true,
  twoFactorEnabled: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    include: {
      role: true,
    },
  },
  memberships: {
    include: {
      institute: {
        select: {
          id: true,
          name: true,
          code: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
  },
};

const registerUser = async (payload: IRegisterUser) => {
  const existingEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already exists");
  }

  if (payload.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone: payload.phone },
    });
    if (existingPhone) {
      throw new ApiError(StatusCodes.CONFLICT, "Phone number already exists");
    }
  }

  const passwordHash = await cryptoHelper.hashPassword(payload.password);

  // Find role (default: STUDENT)
  const targetRoleCode = payload.roleCode || "STUDENT";
  const role = await prisma.role.findFirst({
    where: {
      code: targetRoleCode,
      ...(payload.instituteId ? { instituteId: payload.instituteId } : {}),
    },
  });

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone || null,
      passwordHash,
      avatarUrl: payload.avatarUrl || null,
      status: UserStatus.ACTIVE,
      ...(role && {
        roles: {
          create: {
            roleId: role.id,
          },
        },
      }),
      ...(payload.instituteId && {
        memberships: {
          create: {
            instituteId: payload.instituteId,
          },
        },
      }),
    },
    select: userSelectedFields,
  });

  // Send welcome email asynchronously
  const userName = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || "User";
  emailHelper.sendEmail({
    to: newUser.email!,
    subject: "Welcome to our Platform!",
    html: emailTemplates.welcomeEmail(userName),
  }).catch(() => {});

  return newUser;
};

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      memberships: {
        include: {
          institute: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
  }

  if (user.deletedAt) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Your account has been deleted");
  }

  if (
    user.status === UserStatus.SUSPENDED ||
    user.status === UserStatus.LOCKED ||
    user.status === UserStatus.INACTIVE
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account is ${user.status.toLowerCase()}`,
    );
  }

  if (!user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Password not configured for this user");
  }

  const isPasswordMatched = await cryptoHelper.comparePassword(password, user.passwordHash);
  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password");
  }

  // Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const roles = user.roles.map((r) => r.role.code);

  const jwtPayload = {
    id: user.id,
    email: user.email,
    roles,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    env.jwt.jwt_secret as Secret,
    env.jwt.jwt_expire_in as any,
  );

  const refreshToken = jwtHelper.createToken(
    jwtPayload,
    (process.env.JWT_REFRESH_SECRET || env.jwt.jwt_secret) as Secret,
    env.jwt.jwt_refresh_expire_in as any,
  );

  const { passwordHash: _, ...userData } = user;

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

const refreshToken = async (payload: IRefreshToken) => {
  const { refreshToken: token } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
  }

  const isRevoked = await cacheHelper.isTokenBlacklisted(token);
  if (isRevoked) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token has been revoked");
  }

  let verifyToken: any;
  try {
    verifyToken = jwtHelper.verifyToken(
      token,
      (process.env.JWT_REFRESH_SECRET || env.jwt.jwt_secret) as Secret,
    );
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired Refresh Token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifyToken.id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User is not authorized or inactive");
  }

  const roles = user.roles.map((r) => r.role.code);

  const newJwtPayload = {
    id: user.id,
    email: user.email,
    roles,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const newAccessToken = jwtHelper.createToken(
    newJwtPayload,
    env.jwt.jwt_secret as Secret,
    env.jwt.jwt_expire_in as any,
  );

  return {
    accessToken: newAccessToken,
  };
};

const logout = async (tokenWithBearer: string) => {
  if (!tokenWithBearer) return { message: "Logged out successfully" };
  const token = tokenWithBearer.startsWith("Bearer ")
    ? tokenWithBearer.split(" ")[1]
    : tokenWithBearer;

  await cacheHelper.blacklistToken(token, 86400);
  return { message: "Logged out successfully" };
};

const sendOtp = async (payload: ISendOtp) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User with this email not found");
  }

  const otp = cryptoHelper.generateOTP(6);
  await cacheHelper.setOtp(payload.email, otp, 300);

  await emailHelper.sendEmail({
    to: payload.email,
    subject: "Your Verification Code (OTP)",
    html: emailTemplates.otpEmail(otp, 5),
  });

  return {
    message: "OTP sent to your email successfully",
    ...(env.node_env === "development" && { devOtp: otp }),
  };
};

const verifyOtp = async (payload: IVerifyOtp) => {
  const isValid = await cacheHelper.verifyOtp(payload.email, payload.otp);
  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });

  return {
    message: "OTP verified successfully. Account email is now verified.",
  };
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found or password not configured");
  }

  const isPasswordMatched = await cryptoHelper.comparePassword(
    payload.oldPassword,
    user.passwordHash,
  );
  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect old password");
  }

  const newHashedPassword = await cryptoHelper.hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHashedPassword,
    },
  });

  return { message: "Password changed successfully" };
};

const forgotPassword = async (payload: IForgotPassword) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found with this email");
  }

  if (user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User account is not active");
  }

  const resetTokenPayload = {
    id: user.id,
    email: user.email,
  };

  const resetToken = jwtHelper.createToken(
    resetTokenPayload,
    env.jwt.jwt_secret as Secret,
    "15m",
  );

  const resetLink = `${env.frontend_url}/reset-password?token=${resetToken}`;

  await emailHelper.sendEmail({
    to: user.email!,
    subject: "Reset your password",
    html: emailTemplates.passwordResetEmail(resetLink, 15),
  });

  return {
    message: "Password reset link sent to your email successfully",
    resetToken: env.node_env === "development" ? resetToken : undefined,
  };
};

const resetPassword = async (payload: IResetPassword) => {
  const { token, newPassword } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset token is required");
  }

  let verifyToken: any;
  try {
    verifyToken = jwtHelper.verifyToken(
      token,
      env.jwt.jwt_secret as Secret,
    );
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired reset token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifyToken.id },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User not found or inactive");
  }

  const hashedPassword = await cryptoHelper.hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
    },
  });

  await cacheHelper.blacklistToken(token, 900);

  return { message: "Password reset successfully" };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectedFields,
  });

  if (!user || user.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

export const AuthServices = {
  registerUser,
  loginUser,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};

export default AuthServices;
