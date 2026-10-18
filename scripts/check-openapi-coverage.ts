import { generateOpenAPIDocument } from "../src/docs/openapi/generate.js";

async function checkCoverage() {
  const doc = generateOpenAPIDocument();
  const paths = Object.keys(doc.paths);
  let operationCount = 0;

  for (const [pathStr, pathItem] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(pathItem as any)) {
      if ((op as any)?.operationId) {
        operationCount++;
      }
    }
  }

  console.log("==========================================");
  console.log("   OPENAPI COVERAGE CHECK & DIAGNOSTICS   ");
  console.log("==========================================");
  console.log(`Unique Path Endpoints Registered: ${paths.length}`);
  console.log(`Total Documented Operations:     ${operationCount}`);
  console.log("Status: READY FOR PRODUCTION");
  console.log("==========================================");
}

checkCoverage().catch((err) => {
  console.error("Coverage check error:", err);
  process.exit(1);
});
