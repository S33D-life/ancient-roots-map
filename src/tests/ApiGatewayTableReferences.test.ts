import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Edge functions are not typechecked against the generated database types,
 * so a misspelled table name fails only at runtime. Lock every table the
 * api-gateway queries to a table that exists in the schema.
 */
const types = fs.readFileSync(path.resolve("src/integrations/supabase/types.ts"), "utf8");
const tables = new Set([...types.matchAll(/\n {6}(\w+): \{\n {8}Row: \{/g)].map((m) => m[1]));

const sources = [
  "supabase/functions/api-gateway/index.ts",
  "supabase/functions/api-gateway/services/agentGarden.ts",
];

describe("api-gateway table references", () => {
  it("reads the schema's table list", () => {
    expect(tables.has("offerings")).toBe(true);
    expect(tables.has("meetings")).toBe(true);
  });

  it.each(sources)("%s only queries tables that exist", (file) => {
    const source = fs.readFileSync(path.resolve(file), "utf8");
    const used = [...new Set([...source.matchAll(/\.from\("(\w+)"\)/g)].map((m) => m[1]))];
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !tables.has(name))).toEqual([]);
  });
});
