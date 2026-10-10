/** Reserved markers produced by DevQAPanel's existing test-tree seeder. Not an authority rule. */
export function isQaSeedTree(tree: { name: string; what3words: string | null }): boolean {
  return /^QA Test .+ #[1-9][0-9]*$/.test(tree.name) && /^test\.qa\.[a-z]+$/.test(tree.what3words ?? "");
}
