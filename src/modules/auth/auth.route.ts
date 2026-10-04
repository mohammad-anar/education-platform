import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import auth from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { AuthControllers } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidation.registerZodSchema),
  AuthControllers.registerUser,
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginZodSchema),
  AuthControllers.loginUser,
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthControllers.refreshToken,
);

router.post(
  "/logout",
  auth(),
  AuthControllers.logoutUser,
);

router.post(
  "/send-otp",
  authLimiter,
  validateRequest(AuthValidation.sendOtpZodSchema),
  AuthControllers.sendOtp,
);

router.post(
  "/verify-otp",
  validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthControllers.verifyOtp,
);

router.post(
  "/change-password",
  auth(),
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthControllers.changePassword,
);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidation.forgotPasswordZodSchema),
  AuthControllers.forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthControllers.resetPassword,
);

router.get(
  "/me",
  auth(),
  AuthControllers.getMe,
);

export const AuthRoutes = router;
export default AuthRoutes;
