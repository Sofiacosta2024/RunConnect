import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"];

function resolveAlias(specifier) {
  if (!specifier.startsWith("@/")) return null;

  const relative = specifier.slice(2);
  const candidates = [];

  for (const ext of extensions) {
    candidates.push(path.resolve(repoRoot, `${relative}${ext}`));
  }

  for (const ext of extensions) {
    candidates.push(path.resolve(repoRoot, relative, `index${ext}`));
  }

  const match = candidates.find((candidate) => existsSync(candidate));
  return match ? pathToFileURL(match).href : null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export {}",
      shortCircuit: true,
    };
  }

  const resolved = resolveAlias(specifier);
  if (resolved) {
    return defaultResolve(resolved, context);
  }

  return defaultResolve(specifier, context);
}
