# 🚀 Enterprise Express + Prisma + Redis Backend Starter

A production-ready, TypeScript-first Node.js / Express backend starter template built with Prisma 7, PostgreSQL, Redis caching & token blacklisting, Socket.io, and modular enterprise architecture.

---

## 🌟 Features

- **⚡ Core Stack:** Express 5, TypeScript 5.9, Prisma 7 (with `@prisma/adapter-pg`), PostgreSQL, Redis.
- **🛡️ Authentication & Authorization:**
  - JWT Access & Refresh token rotation
  - Redis-backed Token Blacklisting for instant server-side revocation on logout
  - Password hashing with bcrypt
  - One-Time Password (OTP) generation & verification stored in Redis with TTL
  - Role-based Access Control (RBAC) middleware
- **⚡ Redis Performance Suite:**
  - Automatic JSON cache get/set with TTL
  - Dynamic pattern-based cache invalidation (`delByPattern`)
  - `getOrSet` cache wrapper (cache stampede mitigation)
  - Atomic rate limiting middleware with in-memory fallback
- **🩺 Diagnostics & Monitoring:**
  - `/api/v1/health` deep health check endpoint measuring PostgreSQL & Redis latency and memory usage
  - Timestamped and color-coded structured logger (`logger.info`, `logger.warn`, `logger.error`, `logger.success`, `logger.http`)
  - HTTP request duration logger
- **🛠️ Production Utilities & Helpers:**
  - `prismaHelper`: Dynamic case-insensitive multi-field search, filter condition builder, safe transactions, and paginated queries
  - `cryptoHelper`: Bcrypt hashing, secure random tokens, 6-digit numeric OTPs, UUID, slug generator, string masking
  - `emailHelper`: Modern responsive HTML email templates for OTP verification, password resets, and welcome onboarding
  - `cloudinaryHelper`: Stream and file uploader to Cloudinary with asset deletion
  - `dateHelper`: Expiration checker, duration calculations, date additions
- **📦 Data & File Handling:**
  - Multi-file and single-file upload with Multer to `/uploads`
  - Zod validation middleware for request bodies & query schemas
  - Response normalizer (`sendResponse`) with standard `meta` pagination format
  - Automatic Super Admin seeding on server startup

---

## ⚙️ Environment Configuration (`.env`)

The project is pre-configured to connect to your Docker PostgreSQL and Redis containers:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/prisma_starter_db?schema=public"

BCRYPT_SALT_ROUND=10
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1:3000

# Authentication & JWT
JWT_SECRET=super_secret_jwt_access_token_key_2026_dev_starter
JWT_EXPIRE_IN=1d
JWT_REFRESH_SECRET=super_secret_jwt_refresh_token_key_2026_dev_starter
JWT_REFRESH_EXPIRE_IN=30d

# Redis Cache & PubSub
REDIS_URL="redis://localhost:6379"

# Email Settings (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_FROM="Backend Starter Template <noreply@starter.com>"
EMAIL_PASS=your_app_password

# Cloudinary Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Super Admin Seed Credentials
NAME=Super Admin
EMAIL=admin@example.com
PHONE=01700000000
PASSWORD=admin123456
AVATAR=https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80

FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Client & Sync DB
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Development Server
```bash
pnpm dev
```

Server runs on: `http://localhost:5000`

---

## 📡 API Endpoints Overview

### 🩺 System & Diagnostics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Root API status & info | Public |
| `GET` | `/api/v1/health` | Deep health check (DB + Redis latency + memory) | Public |

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user | Public |
| `POST` | `/api/v1/auth/login` | Login user & issue Access/Refresh tokens | Public |
| `POST` | `/api/v1/auth/refresh-token` | Rotate Access token using Refresh token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke token and blacklist in Redis | Bearer Token |
| `POST` | `/api/v1/auth/send-otp` | Send 6-digit OTP stored in Redis (5 min TTL) | Public |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP & mark user verified | Public |
| `POST` | `/api/v1/auth/forgot-password`| Send password reset email | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password using valid token | Public |
| `POST` | `/api/v1/auth/change-password`| Change password | Bearer Token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |

### 👥 Users Management (`/api/v1/users`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/users` | List users (with pagination, search & filters) | ADMIN |
| `GET` | `/api/v1/users/:id` | Get user by ID (cached in Redis) | Authenticated |
| `POST` | `/api/v1/users` | Create user | ADMIN |
| `PATCH` | `/api/v1/users/:id` | Update user & clear cache | ADMIN |
| `DELETE` | `/api/v1/users/:id` | Soft delete user | ADMIN |

---

## 🧰 Helper Library Reference (`src/utils/`)

Import from `src/utils/index.js` or individual files:

- **`cacheHelper`**:
  - `cacheHelper.get<T>(key)`
  - `cacheHelper.set(key, value, ttlSeconds)`
  - `cacheHelper.del(key)`
  - `cacheHelper.delByPattern("users:*")`
  - `cacheHelper.getOrSet(key, fetcher, ttlSeconds)`
  - `cacheHelper.blacklistToken(token, ttlSeconds)`
  - `cacheHelper.setOtp(email, otp, ttlSeconds)`
  - `cacheHelper.verifyOtp(email, otp)`

- **`prismaHelper`**:
  - `prismaHelper.buildSearchCondition(searchTerm, searchableFields)`
  - `prismaHelper.buildFilterCondition(queryObject)`
  - `prismaHelper.checkDbHealth()`
  - `prismaHelper.runTransaction(async (tx) => { ... })`

- **`cryptoHelper`**:
  - `cryptoHelper.hashPassword(password)`
  - `cryptoHelper.comparePassword(password, hash)`
  - `cryptoHelper.generateOTP(6)`
  - `cryptoHelper.generateRandomToken(32)`
  - `cryptoHelper.generateSlug(title)`
  - `cryptoHelper.maskEmail(email)`

- **`emailHelper`**:
  - `emailHelper.sendEmail({ to, subject, html })`
  - `emailHelper.emailTemplates.otpEmail(otp, minutes)`
  - `emailHelper.emailTemplates.passwordResetEmail(resetLink, minutes)`
  - `emailHelper.emailTemplates.welcomeEmail(name)`

- **`logger`**:
  - `logger.info(msg)` | `logger.success(msg)` | `logger.warn(msg)` | `logger.error(msg)` | `logger.http(msg)`
