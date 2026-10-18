import fs from "fs";
import { z } from "zod";
import { registry } from "../registry.js";
import { registerRoute, successResponse } from "../helpers.js";

// Read route catalog
const catalogUrl = new URL("../route-catalog.json", import.meta.url);
const catalogRaw = fs.readFileSync(catalogUrl, "utf8");
const catalog: {
  method: "get" | "post" | "patch" | "delete" | "put";
  path: string;
  guard: string;
  schema: string;
  isPublic: boolean;
  tag: string;
}[] = JSON.parse(catalogRaw);

// Find existing registered routes in registry definitions
const existingRoutes = new Set<string>();

for (const def of registry.definitions) {
  if (def.type === "route") {
    const r = (def as any).route;
    const norm = r.path.replace(/\{([a-zA-Z0-9_]+)\}/g, ":$1");
    existingRoutes.add(`${r.method.toLowerCase()} ${norm}`);
  }
}

// Register any route that wasn't already registered by explicit module files
for (const item of catalog) {
  const routeKey = `${item.method.toLowerCase()} ${item.path}`;
  if (existingRoutes.has(routeKey)) {
    continue;
  }

  // Derive summary from path & method
  const pathParts = item.path.replace(/^\/api\/v1\//, "").split("/");
  const lastPart = pathParts[pathParts.length - 1];
  const isParam = lastPart.startsWith(":");
  const actionNoun = isParam ? pathParts[pathParts.length - 2] || "resource" : lastPart;

  let summary = `${item.method.toUpperCase()} ${item.path}`;
  if (item.method === "get") {
    summary = isParam ? `Get ${actionNoun} details by ID` : `List ${actionNoun} records`;
  } else if (item.method === "post") {
    summary = `Create ${actionNoun} record / action`;
  } else if (item.method === "patch" || item.method === "put") {
    summary = `Update ${actionNoun} record`;
  } else if (item.method === "delete") {
    summary = `Delete ${actionNoun} record`;
  }

  // Detect path parameters e.g. :id, :childId, :tenantId, :section
  const paramMatches = item.path.match(/:([a-zA-Z0-9_]+)/g) || [];
  let paramsSchema: z.ZodObject<any> | undefined = undefined;

  if (paramMatches.length > 0) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const match of paramMatches) {
      const paramName = match.substring(1);
      shape[paramName] = z.string().openapi({
        description: `Identifier for ${paramName}`,
        example: paramName === "childId" 
          ? "cly01std_rahim2026" 
          : paramName === "tenantId" 
          ? "cly01inst_dhaka2026" 
          : paramName === "section"
          ? "branding"
          : "cly01res_sample123",
      });
    }
    paramsSchema = z.object(shape);
  }

  // Default realistic payload example for mutations
  let requestBody: any = undefined;
  if (["post", "patch", "put"].includes(item.method)) {
    requestBody = {
      content: {
        "application/json": {
          schema: z.record(z.string(), z.any()).openapi({
            description: `Request payload for ${summary}`,
          }),
          example: {
            status: "ACTIVE",
            notes: "Updated from API portal",
            timestamp: new Date().toISOString(),
          },
        },
      },
    };
  }

  const successCode = item.method === "post" ? 201 : 200;

  registerRoute({
    method: item.method,
    path: item.path,
    tag: item.tag,
    summary,
    description: `Endpoint protected by \`${item.guard}\` guard.`,
    permission: item.guard,
    scope: "INSTITUTE",
    isPublic: item.isPublic,
    auditLogged: ["post", "patch", "put", "delete"].includes(item.method),
    request: {
      params: paramsSchema,
      body: requestBody,
    },
    responses: {
      [successCode]: {
        description: `${summary} completed successfully`,
        content: {
          "application/json": {
            schema: successResponse(
              z.object({
                success: z.boolean().openapi({ example: true }),
                entityId: z.string().optional().openapi({ example: "cly01res_sample123" }),
              }),
              `${summary} succeeded`
            ),
          },
        },
      },
    },
  });
}
