import cors from "cors";
import express, { Application, Request, Response } from "express";
import compression from "compression";
import env from "./config/env.js";
import routes from "./modules/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import sanitizeRequest from "./middleware/sanitize.middleware.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

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

// Apply rate limiting on API routes
app.use("/api/v1", generalLimiter, routes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    name: "Backend Template API",
    status: "online",
    environment: env.node_env,
    uptime: process.uptime().toFixed(2) + " sec",
    timestamp: new Date().toISOString(),
    documentation: "/api/v1",
  });
});

// Error handling middlewares
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
