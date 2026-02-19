import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const NEW_VERSION = process.argv[2];

if (!NEW_VERSION) {
  console.error("❌ Please provide a version: npm run version:sync 0.2.0");
  process.exit(1);
}

const ROOT_DIR = path.resolve(__dirname, "..");

function updatePackageJson(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const oldVersion = content.version;
  content.version = NEW_VERSION;

  // Also update internal workspaces dependencies if they exist
  if (content.dependencies) {
    Object.keys(content.dependencies).forEach((dep) => {
      if (
        dep.startsWith("@knotengine/") &&
        content.dependencies[dep].includes("workspace:")
      ) {
        // pnpm workspace refs usually look like "workspace:*" or "workspace:^" or "workspace:0.1.0"
        // If it's a fixed version, update it. If it's *, leave it.
        if (!content.dependencies[dep].includes("*")) {
          content.dependencies[dep] = `workspace:${NEW_VERSION}`;
        }
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
  console.log(
    `✅ Updated ${path.relative(ROOT_DIR, filePath)}: ${oldVersion} -> ${NEW_VERSION}`,
  );
}

// 1. Update Root
updatePackageJson(path.join(ROOT_DIR, "package.json"));

// 2. Find all child packages
const folders = ["apps", "packages"];
folders.forEach((folder) => {
  const folderPath = path.join(ROOT_DIR, folder);
  if (!fs.existsSync(folderPath)) return;

  const subfolders = fs.readdirSync(folderPath);
  subfolders.forEach((sub: string) => {
    const pkgPath = path.join(folderPath, sub, "package.json");
    if (fs.existsSync(pkgPath)) {
      updatePackageJson(pkgPath);
    }
  });
});

console.log(
  "\n✨ All versions synchronized. Running pnpm install to update lockfile...",
);
try {
  execSync("pnpm install", { stdio: "inherit" });
} catch (e) {
  console.warn("⚠️ pnpm install failed, you may need to run it manually.");
}
