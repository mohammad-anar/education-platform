import { describe, it, expect } from "vitest";
import SwaggerParser from "@apidevtools/swagger-parser";
import { generateOpenAPIDocument } from "./generate.js";

describe("OpenAPI Documentation Specification Tests", () => {
  it("should generate a valid OpenAPI 3.0 document that passes SwaggerParser validation", async () => {
    const doc = generateOpenAPIDocument();
    expect(doc).toBeDefined();
    expect(doc.openapi).toMatch(/^3\.0/);
    expect(doc.info.title).toContain("Education Platform");

    // Deep structural schema validation via SwaggerParser
    const validated = await SwaggerParser.validate(JSON.parse(JSON.stringify(doc)));
    expect(validated).toBeDefined();
  });

  it("should have all unique operationIds across paths", () => {
    const doc = generateOpenAPIDocument();
    const operationIds: string[] = [];

    for (const [pathStr, pathItem] of Object.entries(doc.paths)) {
      for (const [method, op] of Object.entries(pathItem as any)) {
        if ((op as any)?.operationId) {
          operationIds.push((op as any).operationId);
        }
      }
    }

    const uniqueSet = new Set(operationIds);
    expect(operationIds.length).toBe(uniqueSet.size);
  });

  it("should not expose sensitive secret fields in schemas or examples", () => {
    const doc = generateOpenAPIDocument();
    const docString = JSON.stringify(doc);

    expect(docString).not.toContain("passwordHash");
    expect(docString).not.toContain("password_hash");
    expect(docString).not.toContain("twoFactorSecret");
  });
});
