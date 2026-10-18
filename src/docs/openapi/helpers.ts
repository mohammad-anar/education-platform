import { z } from "zod";
import { registry } from "./registry.js";
import {
  PaginationMetaSchema,
  CursorPaginationSchema,
} from "./components.js";

export interface IRouteRegistrationOptions {
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  tag: string;
  summary: string;
  description?: string;
  permission?: string;
  scope?: "OWN" | "ASSIGNED" | "INSTITUTE" | "ALL" | string;
  request?: {
    params?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    body?: {
      description?: string;
      content: {
        [mediaType: string]: {
          schema: z.ZodTypeAny;
          example?: any;
          examples?: any;
        };
      };
    };
  };
  responses: {
    [statusCode: number]: {
      description: string;
      content?: {
        [mediaType: string]: {
          schema: z.ZodTypeAny;
          example?: any;
          examples?: any;
        };
      };
    };
  };
  isPublic?: boolean;
  auditLogged?: boolean;
  cached?: boolean;
  idempotent?: boolean;
  deprecated?: boolean;
  operationId?: string;
}

/**
 * Wraps payload schema with standard API success envelope
 */
export function successResponse<T extends z.ZodTypeAny>(
  dataSchema: T,
  description: string = "Successful operation"
) {
  return z.object({
    success: z.literal(true).openapi({ example: true }),
    statusCode: z.number().openapi({ example: 200 }),
    message: z.string().openapi({ example: description }),
    data: dataSchema,
  });
}

/**
 * Wraps list item schema with standard offset pagination envelope
 */
export function paginated<T extends z.ZodTypeAny>(
  itemSchema: T,
  description: string = "Paginated list response"
) {
  return z.object({
    success: z.literal(true).openapi({ example: true }),
    statusCode: z.number().openapi({ example: 200 }),
    message: z.string().openapi({ example: description }),
    meta: PaginationMetaSchema,
    data: z.array(itemSchema),
  });
}

/**
 * Wraps list item schema with cursor-based pagination envelope
 */
export function cursorPaginated<T extends z.ZodTypeAny>(
  itemSchema: T,
  description: string = "Cursor-paginated list response"
) {
  return z.object({
    success: z.literal(true).openapi({ example: true }),
    statusCode: z.number().openapi({ example: 200 }),
    message: z.string().openapi({ example: description }),
    pagination: CursorPaginationSchema,
    data: z.array(itemSchema),
  });
}

/**
 * Automatically registers route in OpenAPI registry with security, vendor extensions, and error responses.
 */
export function registerRoute(opts: IRouteRegistrationOptions) {
  const isPublic = !!opts.isPublic;
  const permission = opts.permission || (isPublic ? "None (Public)" : "auth.authenticated");
  const scope = opts.scope || "INSTITUTE";

  let fullDescription = opts.description || opts.summary;
  if (!isPublic) {
    fullDescription = `${fullDescription}\n\n**Required permission:** \`${permission}\` (scope: \`${scope}\`)`;
    if (opts.auditLogged) {
      fullDescription += `\n*Note: This operation writes an immutable AuditLog entry.*`;
    }
  }

  // Derive unique camelCase operationId if not provided
  const cleanPath = opts.path
    .replace(/^\/api\/v1\//, "")
    .replace(/\/+/g, "_")
    .replace(/:([a-zA-Z0-9_]+)/g, "by_$1")
    .replace(/[^a-zA-Z0-9_]/g, "");
  const defaultOpId = `${opts.method}_${cleanPath}`.replace(/_([a-z0-9])/g, (_, l) =>
    l.toUpperCase()
  );

  const openApiPath = opts.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

  // Prepare request parameters, query, and headers
  let requestObj: any = opts.request ? { ...opts.request } : undefined;

  // Auto-declare path parameters if not explicitly provided
  const pathParams = Array.from(openApiPath.matchAll(/\{([a-zA-Z0-9_]+)\}/g)).map((m) => m[1]);
  if (pathParams.length > 0 && (!requestObj || !requestObj.params)) {
    if (!requestObj) requestObj = {};
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const p of pathParams) {
      shape[p] = z.string().openapi({
        description: `Identifier for ${p}`,
        example: p.toLowerCase().includes("tenant") || p.toLowerCase().includes("institute")
          ? "8f047731-26b7-43ea-92a3-9d0e35e970ab"
          : p.toLowerCase().includes("user")
          ? "e62bf410-7ffb-427f-b25e-3ad2c51305f0"
          : "cly01id_sample123",
      });
    }
    requestObj.params = z.object(shape);
  }

  // Auto-attach X-Institute-Id header parameter for protected routes
  if (!isPublic) {
    if (!requestObj) requestObj = {};
    const tenantHeaderField = z.string().optional().openapi({
      description:
        "Multi-tenant Institute Context ID (e.g. 8f047731-26b7-43ea-92a3-9d0e35e970ab). Automatically attached on all requests via Swagger UI Authorize or Login.",
      example: "8f047731-26b7-43ea-92a3-9d0e35e970ab",
      param: {
        name: "X-Institute-Id",
        in: "header",
      },
    });

    if (requestObj.headers && requestObj.headers instanceof z.ZodObject) {
      requestObj.headers = requestObj.headers.extend({
        "X-Institute-Id": tenantHeaderField,
      });
    } else if (!requestObj.headers) {
      requestObj.headers = z.object({
        "X-Institute-Id": tenantHeaderField,
      });
    }
  }

  const routeDef: any = {
    method: opts.method,
    path: openApiPath,
    tags: [opts.tag],
    summary: opts.summary,
    description: fullDescription,
    operationId: opts.operationId || defaultOpId,
    deprecated: opts.deprecated || false,
    security: isPublic
      ? []
      : [
          { bearerAuth: [], tenantAuth: [] },
          { bearerAuth: [] },
        ],
    request: requestObj,
    responses: {
      ...opts.responses,
      400: { $ref: "#/components/responses/ValidationError" },
      404: { $ref: "#/components/responses/NotFound" },
      429: { $ref: "#/components/responses/RateLimited" },
    },
    "x-permission": permission,
    "x-scope": scope,
    "x-audit-logged": !!opts.auditLogged,
    "x-cached": !!opts.cached,
    "x-idempotent": !!opts.idempotent,
  };

  if (!isPublic) {
    routeDef.responses[401] = { $ref: "#/components/responses/Unauthorized" };
    routeDef.responses[403] = { $ref: "#/components/responses/Forbidden" };
    routeDef.responses[409] = { $ref: "#/components/responses/Conflict" };
  }

  registry.registerPath(routeDef);
}

export default {
  registerRoute,
  successResponse,
  paginated,
  cursorPaginated,
};
