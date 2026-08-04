import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_trees",
  title: "Search ancient friends",
  description:
    "Search the S33D atlas of ancient trees by name, species, or nation. Returns matching trees with location and lineage.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against tree name, species, or nation."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const like = `%${query.replace(/[%_,]/g, "")}%`;
    const { data, error } = await supabase
      .from("trees")
      .select("id, name, species, nation, state, latitude, longitude, estimated_age, lineage")
      .or(`name.ilike.${like},species.ilike.${like},nation.ilike.${like}`)
      .limit(limit ?? 10);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { trees: data ?? [] },
    };
  },
});
