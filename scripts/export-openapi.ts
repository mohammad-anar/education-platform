import fs from "fs";
import path from "path";
import yaml from "yaml";
import { generateOpenAPIDocument } from "../src/docs/openapi/generate.js";

async function exportDocs() {
  const doc = generateOpenAPIDocument();
  const docsDir = path.resolve(process.cwd(), "docs");

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const jsonPath = path.join(docsDir, "openapi.json");
  const yamlPath = path.join(docsDir, "openapi.yaml");

  fs.writeFileSync(jsonPath, JSON.stringify(doc, null, 2), "utf8");
  fs.writeFileSync(yamlPath, yaml.stringify(doc), "utf8");

  console.log(`✅ Exported OpenAPI JSON: ${jsonPath}`);
  console.log(`✅ Exported OpenAPI YAML: ${yamlPath}`);
  console.log(`📊 Total Paths Documented: ${Object.keys(doc.paths).length}`);
}

exportDocs().catch((err) => {
  console.error("Failed to export documentation:", err);
  process.exit(1);
});
