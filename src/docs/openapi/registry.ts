import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Initialize OpenAPI extensions on Zod
extendZodWithOpenApi(z);

// Single global OpenAPI registry instance
export const registry = new OpenAPIRegistry();

export default registry;
