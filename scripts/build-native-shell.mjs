import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const output = path.join(root, "native-dist");
const renderedApp = path.join(root, ".next", "server", "app");

function buildVersion() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return `native-${Date.now()}`;
  }
}

const version = buildVersion();
let html = await readFile(path.join(renderedApp, "index.html"), "utf8");
html = html.replaceAll("__DEEDS_NATIVE_BUILD__", version);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(output, "_next", "static"), { recursive: true });
await cp(path.join(root, "public"), output, { recursive: true });
await mkdir(path.join(output, "privacy"), { recursive: true });
await writeFile(path.join(output, "index.html"), html);
await writeFile(path.join(output, "privacy", "index.html"), await readFile(path.join(renderedApp, "privacy.html"), "utf8"));
await writeFile(path.join(output, "manifest.webmanifest"), await readFile(path.join(renderedApp, "manifest.webmanifest.body"), "utf8"));
await writeFile(path.join(output, "native-build.json"), JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2));

const runtimePath = path.join(output, "native-runtime.js");
const runtime = (await readFile(runtimePath, "utf8")).replace(
  '"__DEEDS_NATIVE_BUILD__"',
  JSON.stringify(version),
);
await writeFile(runtimePath, runtime);
console.log(`Packaged D.E.E.D.S. native shell ${version.slice(0, 12)} in native-dist/.`);
