import cors from "cors";
import express, { Application, Request, Response } from "express";
import compression from "compression";
import env from "./config/env.js";
import routes from "./modules/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import sanitizeRequest from "./middleware/sanitize.middleware.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { DocsRouter } from "./docs/openapi/index.js";
import { HealthRoutes } from "./modules/health/health.route.js";

const app: Application = express();
const corsOrigins = env.cors_origin || "*";

// HTTP & Security Middlewares
app.use(
  cors({
    origin: corsOrigins.includes(",")
      ? corsOrigins.split(",").map((origin) => origin.trim())
      : corsOrigins === "*"
      ? "*"
      : [corsOrigins],
    credentials: true,
  }),
);

app.use(compression());
app.use(requestLogger);

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeRequest);

// Static uploads folder
app.use("/uploads", express.static("uploads"));

// Direct Health Check Route
app.use("/health", HealthRoutes);

// Apply rate limiting on API routes
app.use("/api/v1", generalLimiter, routes);

// OpenAPI / Swagger UI Documentation
app.use("/api/docs", DocsRouter);
app.use("/docs", (req: Request, res: Response) => res.redirect("/api/docs"));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    name: "Multi-Tenant Education Platform API",
    status: "online",
    environment: env.node_env,
    uptime: process.uptime().toFixed(2) + " sec",
    timestamp: new Date().toISOString(),
    documentation: "/api/docs",
    openapi: "/api/docs/openapi.json",
    api: "/api/v1",
    health: "/api/v1/health",
  });
});

// Error handling middlewares
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
