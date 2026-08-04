import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchTrees from "./tools/search-trees";
import getTree from "./tools/get-tree";
import listMyTrees from "./tools/list-my-trees";
import whoami from "./tools/whoami";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "s33d",
  title: "S33D",
  version: "0.1.0",
  instructions:
    "Tools for S33D, a living atlas of ancient trees. Use `search_trees` to find ancient friends by name, species or nation, `get_tree` to read one tree and its offerings, `list_my_trees` for the signed-in keeper's own mapped trees, and `whoami` for their profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchTrees, getTree, listMyTrees, whoami],
});
