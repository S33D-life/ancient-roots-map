import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_tree",
  title: "Get tree with offerings",
  description:
    "Fetch one ancient friend by id, together with its most recent offerings (stories, art, quotes, music).",
  inputSchema: {
    tree_id: z.string().uuid().describe("The tree's id."),
    offering_limit: z.number().int().min(1).max(50).optional().describe("How many offerings to include (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tree_id, offering_limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: tree, error: treeError } = await supabase
      .from("trees")
      .select("*")
      .eq("id", tree_id)
      .maybeSingle();

    if (treeError) return { content: [{ type: "text", text: treeError.message }], isError: true };
    if (!tree) return { content: [{ type: "text", text: "No tree found with that id." }], isError: true };

    const { data: offerings, error: offeringsError } = await supabase
      .from("offerings")
      .select("id, type, title, content, quote_text, quote_author, art_origin, created_at")
      .eq("tree_id", tree_id)
      .order("created_at", { ascending: false })
      .limit(offering_limit ?? 10);

    if (offeringsError) {
      return { content: [{ type: "text", text: offeringsError.message }], isError: true };
    }

    const payload = { tree, offerings: offerings ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
