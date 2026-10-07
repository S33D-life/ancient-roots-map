import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchTrees from "./tools/search-trees";
import getTree from "./tools/get-tree";
import listMyTrees from "./tools/list-my-trees";
import whoami from "./tools/whoami";
import { livingDreamTools } from "./tools/living-dream";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "s33d",
  title: "S33D",
  version: "0.1.0",
  instructions:
    "Tools for S33D, a living atlas of ancient trees. Use `search_trees` to find ancient friends by name, species or nation, `get_tree` to read one tree and its offerings, `list_my_trees` for the signed-in keeper's own mapped trees, and `whoami` for their profile. Use `get_current_circle` for the approved public Circle and `list_growth_items` / `get_growth_item` for the same public growth records used by the Crown Folio. These are checked-in projections, not live Notion reads. MCP access grants no Staff, Curator or TEOTAG authority, reward or publishing permission, or canonical promotion. Growth maturity is independent of engineering state; relationship truth must not be inferred from maturity. Current priorities are unavailable until an approved Notion projection exists.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchTrees, getTree, listMyTrees, whoami, ...livingDreamTools],
});
