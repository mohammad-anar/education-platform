import { z } from "zod";
import { registerRoute, successResponse } from "../helpers.js";
import { AuthValidation } from "../../../modules/auth/auth.validation.js";

const AuthUserResponseSchema = z.object({
  id: z.string().openapi({ example: "cly01user123" }),
  email: z.string().email().openapi({ example: "anar.khan@education.bd" }),
  firstName: z.string().openapi({ example: "Anar" }),
  lastName: z.string().nullable().optional().openapi({ example: "Khan" }),
  phone: z.string().nullable().optional().openapi({ example: "+8801712345678" }),
  avatarUrl: z.string().nullable().optional().openapi({ example: "https://assets.education.bd/avatars/anar.jpg" }),
  status: z.string().openapi({ example: "ACTIVE" }),
  twoFactorEnabled: z.boolean().openapi({ example: false }),
});

const LoginResponseSchema = z.object({
  accessToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  refreshToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
  user: AuthUserResponseSchema,
  needs2FA: z.boolean().optional().openapi({ example: false }),
});

// 1. POST /api/v1/auth/register
registerRoute({
  method: "post",
  path: "/api/v1/auth/register",
  tag: "Auth",
  summary: "Register new user account",
  isPublic: true,
  operationId: "authRegister",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.registerZodSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: successResponse(AuthUserResponseSchema, "User registered successfully"),
        },
      },
    },
  },
});

// 2. POST /api/v1/auth/login
registerRoute({
  method: "post",
  path: "/api/v1/auth/login",
  tag: "Auth",
  summary: "User login (JWT token issue)",
  isPublic: true,
  operationId: "authLogin",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.loginZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Authentication successful",
      content: {
        "application/json": {
          schema: successResponse(LoginResponseSchema, "Login successful"),
        },
      },
    },
  },
});

// 3. POST /api/v1/auth/refresh-token
registerRoute({
  method: "post",
  path: "/api/v1/auth/refresh-token",
  tag: "Auth",
  summary: "Refresh access token",
  isPublic: true,
  operationId: "authRefreshToken",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.refreshTokenZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "New access token issued",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ accessToken: z.string() }),
            "Token refreshed successfully"
          ),
        },
      },
    },
  },
});

// 4. POST /api/v1/auth/logout
registerRoute({
  method: "post",
  path: "/api/v1/auth/logout",
  tag: "Auth",
  summary: "Log out active session",
  isPublic: false,
  operationId: "authLogout",
  responses: {
    200: {
      description: "Session revoked and logged out",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "Logged out successfully"),
        },
      },
    },
  },
});

// 5. POST /api/v1/auth/send-otp
registerRoute({
  method: "post",
  path: "/api/v1/auth/send-otp",
  tag: "Auth",
  summary: "Send 6-digit OTP code to email",
  isPublic: true,
  operationId: "authSendOtp",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.sendOtpZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP sent to email address",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "OTP sent successfully"),
        },
      },
    },
  },
});

// 6. POST /api/v1/auth/verify-otp
registerRoute({
  method: "post",
  path: "/api/v1/auth/verify-otp",
  tag: "Auth",
  summary: "Verify 6-digit OTP code",
  isPublic: true,
  operationId: "authVerifyOtp",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.verifyOtpZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP verified successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({ verified: z.boolean() }), "OTP verified successfully"),
        },
      },
    },
  },
});

// 7. POST /api/v1/auth/change-password
registerRoute({
  method: "post",
  path: "/api/v1/auth/change-password",
  tag: "Auth",
  summary: "Change account password",
  isPublic: false,
  auditLogged: true,
  operationId: "authChangePassword",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.changePasswordZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "Password changed successfully"),
        },
      },
    },
  },
});

// 8. POST /api/v1/auth/forgot-password
registerRoute({
  method: "post",
  path: "/api/v1/auth/forgot-password",
  tag: "Auth",
  summary: "Request password reset link",
  isPublic: true,
  operationId: "authForgotPassword",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.forgotPasswordZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reset link sent if account exists",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "Password reset instructions dispatched"),
        },
      },
    },
  },
});

// 9. POST /api/v1/auth/reset-password
registerRoute({
  method: "post",
  path: "/api/v1/auth/reset-password",
  tag: "Auth",
  summary: "Reset password using reset token",
  isPublic: true,
  auditLogged: true,
  operationId: "authResetPassword",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthValidation.resetPasswordZodSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset completed successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "Password reset successfully"),
        },
      },
    },
  },
});

// 10. GET /api/v1/auth/me
registerRoute({
  method: "get",
  path: "/api/v1/auth/me",
  tag: "Auth",
  summary: "Get current authenticated user profile & memberships",
  isPublic: false,
  operationId: "authGetMe",
  responses: {
    200: {
      description: "Current user profile and roles",
      content: {
        "application/json": {
          schema: successResponse(AuthUserResponseSchema, "User profile retrieved"),
        },
      },
    },
  },
});
