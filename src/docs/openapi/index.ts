import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import env from "../../config/env.js";
import { generateOpenAPIDocument } from "./generate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const customJsContent = fs.readFileSync(path.join(__dirname, "swagger-custom.js"), "utf8");
const customCssContent = fs.readFileSync(path.join(__dirname, "swagger-custom.css"), "utf8");

const router = express.Router();

// Generate document once on boot and cache in memory
let cachedSpec: any = null;

function getSpec() {
  if (!cachedSpec) {
    cachedSpec = generateOpenAPIDocument();
  }
  return cachedSpec;
}

// Basic auth middleware if configured
function basicAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authUser = process.env.DOCS_BASIC_AUTH_USER;
  const authPass = process.env.DOCS_BASIC_AUTH_PASSWORD;

  if (!authUser || !authPass) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="API Documentation"');
    return res.status(401).send("Authentication required for API Documentation");
  }

  const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8");
  const [user, pass] = credentials.split(":");

  if (user === authUser && pass === authPass) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="API Documentation"');
  return res.status(401).send("Invalid Documentation Credentials");
}

// Guard by DOCS_ENABLED (default true in non-production, false in production unless explicit)
function docsEnabledCheck(req: Request, res: Response, next: NextFunction) {
  const enabled = process.env.DOCS_ENABLED !== undefined
    ? process.env.DOCS_ENABLED === "true"
    : env.node_env !== "production";

  if (!enabled) {
    return res.status(404).json({
      success: false,
      message: "API Documentation is disabled in this environment.",
    });
  }

  next();
}
// 1. Raw OpenAPI JSON specification
router.get("/openapi.json", docsEnabledCheck, basicAuthMiddleware, (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(getSpec());
});

// 2. Custom Automation Script & Styles
router.get("/swagger-custom.js", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(customJsContent);
});

router.get("/swagger-custom.css", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/css");
  res.send(customCssContent);
});

// 3. Swagger UI documentation
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: "alpha",
    docExpansion: "none",
    tryItOutEnabled: true,
    filter: true,
    displayRequestDuration: true,
  },
  customSiteTitle: "Multi-Tenant Education Platform API Documentation",
  customJs: "/api/docs/swagger-custom.js",
  customCss: customCssContent,
  customCssUrl: "/api/docs/swagger-custom.css",
};

router.use(
  "/",
  docsEnabledCheck,
  basicAuthMiddleware,
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    const spec = getSpec();
    const handler = swaggerUi.setup(spec, swaggerUiOptions);
    handler(req, res, next);
  }
);

export const DocsRouter = router;
export default DocsRouter;
