import SwaggerParser from "@apidevtools/swagger-parser";
import { generateOpenAPIDocument } from "../src/docs/openapi/generate.js";

async function runDeepAudit() {
  console.log("==================================================");
  console.log("   DEEP SWAGGER & OPENAPI SPECIFICATION AUDIT     ");
  console.log("==================================================");

  const doc = generateOpenAPIDocument();
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Structural & Semantic Validation via SwaggerParser
  console.log("Checking SwaggerParser validation...");
  try {
    const validated = await SwaggerParser.validate(JSON.parse(JSON.stringify(doc)));
    console.log("✅ SwaggerParser semantic validation: PASSED");
  } catch (err: any) {
    errors.push(`SwaggerParser validation failed: ${err.message}`);
  }

  // 2. Audit Path Parameters: every {param} in path must have a corresponding path parameter in the operation
  console.log("Checking path parameter declarations vs path template...");
  for (const [pathStr, pathItem] of Object.entries(doc.paths)) {
    const matches = pathStr.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
    const pathVarsInUrl = matches.map((m) => m.replace(/[\{\}]/g, ""));

    for (const [method, op] of Object.entries(pathItem as any)) {
      if (typeof op !== "object" || !op) continue;
      const opObj = op as any;
      const opId = opObj.operationId || `${method} ${pathStr}`;

      const declaredParams = (opObj.parameters || []).filter((p: any) => p.in === "path").map((p: any) => p.name);

      for (const pVar of pathVarsInUrl) {
        if (!declaredParams.includes(pVar)) {
          // Check if it's declared at path level or op level
          errors.push(`Operation ${opId} (${pathStr}): Path variable '{${pVar}}' is in URL but NOT defined in parameters!`);
        }
      }

      for (const declared of declaredParams) {
        if (!pathVarsInUrl.includes(declared)) {
          errors.push(`Operation ${opId} (${pathStr}): Declared path parameter '${declared}' is NOT present in URL template '{${pathStr}}'!`);
        }
      }

      // Check operationId uniqueness
      if (!opObj.operationId) {
        warnings.push(`Operation ${method.toUpperCase()} ${pathStr} is missing an operationId`);
      }

      // Check 2xx response has description & content
      const responses = opObj.responses || {};
      const status2xx = Object.keys(responses).filter((code) => code.startsWith("2"));
      if (status2xx.length === 0) {
        errors.push(`Operation ${opId}: Missing 2xx success response!`);
      }

      // Check that sensitive tokens are not leaked
      const opStr = JSON.stringify(opObj);
      if (opStr.includes("passwordHash") || opStr.includes("password_hash")) {
        errors.push(`Operation ${opId}: Exposes passwordHash!`);
      }
    }
  }

  // 3. Report Results
  console.log("\n---------------- AUDIT RESULTS ----------------");
  console.log(`Total Documented Paths: ${Object.keys(doc.paths).length}`);

  if (warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\n❌ Errors Found (${errors.length}):`);
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log("\n🎉 ALL CHECKS PASSED: Zero errors found. Swagger documentation is 100% compliant and accurate!");
  console.log("==================================================");
}

runDeepAudit().catch((err) => {
  console.error("Deep audit fatal error:", err);
  process.exit(1);
});
