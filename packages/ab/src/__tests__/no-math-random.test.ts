/**
 * Guard for the acceptance criterion "No Math.random anywhere in
 * edge-executed code": greps every source file in src/ (tests excluded).
 * Math.random in a reused Vercel Edge isolate can repeat across invocations
 * and deterministically pin visitors to one variant — the original belgium
 * incident. All randomness must come from crypto.getRandomValues/randomUUID.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      files.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe("edge-safety", () => {
  const files = collectSourceFiles(srcDir);

  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it("never calls Math.random in package source", () => {
    // Call-site pattern (comments explaining WHY it's banned are fine).
    const callSite = /Math\s*\.\s*random\s*\(/;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(callSite.test(content), `Math.random() call found in ${file}`).toBe(false);
    }
  });

  it("edge-executed modules import no Node built-ins or next/server", () => {
    for (const name of ["funnel.ts", "cookies.ts", "scoring.ts", "index.ts"]) {
      const content = readFileSync(join(srcDir, name), "utf8");
      const imports = [...content.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
      for (const spec of imports) {
        expect(spec?.startsWith("node:"), `node builtin import in ${name}: ${spec}`).toBe(false);
        expect(spec, `next/server must stay out of @dreamplay/ab (${name})`).not.toContain("next");
      }
    }
  });
});
