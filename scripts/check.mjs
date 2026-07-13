import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pluginRoot = join(root, "plugins", "codex-thinkboard");
const manifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
const marketplacePath = join(root, ".agents", "plugins", "marketplace.json");
const skillPath = join(pluginRoot, "skills", "thinkboard", "SKILL.md");
const mcpPath = join(pluginRoot, ".mcp.json");
const mcpServerPath = join(pluginRoot, "mcp", "server.mjs");
const webIndexPath = join(pluginRoot, "web", "dist", "index.html");
const packagePath = join(root, "package.json");
const errors = [];
const scaffoldMarker = "[" + "TODO:";
const MAX_CODE_LINES = 1000;
const ignoredDirectories = new Set([".git", ".playwright-cli", "dist", "node_modules", "output"]);

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${relative(root, path)} is not valid JSON: ${error.message}`);
    return {};
  }
}

const manifest = readJson(manifestPath);
const marketplace = readJson(marketplacePath);
const mcp = readJson(mcpPath);
const packageJson = readJson(packagePath);
const skill = readFileSync(skillPath, "utf8");

assert(manifest.name === "codex-thinkboard", "plugin name must match its folder");
assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version ?? ""), "plugin version must be semver");
assert(manifest.license === "Apache-2.0", "plugin license must match LICENSE");
assert(manifest.skills === "./skills/", "plugin skills path must be relative to plugin root");
assert(manifest.mcpServers === "./.mcp.json", "plugin must register the bundled MCP server");
assert(manifest.version.startsWith(packageJson.version), "plugin and package versions must share a base version");
assert(Array.isArray(manifest.interface?.defaultPrompt), "defaultPrompt must be an array");
assert(manifest.interface?.defaultPrompt?.length <= 3, "defaultPrompt supports at most three entries");

const entry = marketplace.plugins?.find((plugin) => plugin.name === manifest.name);
assert(entry, "marketplace must include codex-thinkboard");
assert(entry?.source?.path === "./plugins/codex-thinkboard", "marketplace source path is incorrect");
assert(entry?.policy?.installation === "AVAILABLE", "marketplace install policy must be explicit");
assert(entry?.policy?.authentication === "ON_INSTALL", "marketplace auth policy must be explicit");

assert(mcp.mcpServers?.thinkboard?.command === "node", "Thinkboard MCP must use the local Node runtime");
assert(mcp.mcpServers?.thinkboard?.args?.[0] === "./mcp/server.mjs", "Thinkboard MCP entry point is incorrect");
assert(mcp.mcpServers?.thinkboard?.cwd === ".", "Thinkboard MCP cwd must be the plugin root");
assert(statSync(mcpServerPath).isFile(), "Thinkboard MCP server is missing");
assert(statSync(webIndexPath).isFile(), "Thinkboard web build is missing");

assert(/^---\nname: thinkboard\ndescription: .+\n---/s.test(skill), "skill frontmatter is incomplete");
assert(!skill.includes(scaffoldMarker), "skill contains a scaffold TODO");

function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (/\.(md|json|ya?ml|[cm]?js|ts|tsx|css|html)$/.test(name)) {
      const content = readFileSync(path, "utf8");
      assert(!content.includes(scaffoldMarker), `${relative(root, path)} contains a scaffold TODO`);
      const isGeneratedLockFile = name === "package-lock.json";
      const isCodeFile = /\.(css|html|[cm]?js|json|ts|tsx)$/.test(name);
      if (isCodeFile && !isGeneratedLockFile) {
        const lineCount = content.split(/\r?\n/).length;
        assert(lineCount <= MAX_CODE_LINES, `${relative(root, path)} exceeds ${MAX_CODE_LINES} lines (${lineCount})`);
      }
    }
  }
}

walk(root);

if (errors.length > 0) {
  console.error("Validation failed:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Thinkboard repository validation passed.");
