import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc },
}));

import {
  ROOT_TYPE_DETAILS,
  createGroveRoot,
  rootTypeLabel,
  type RootType,
} from "@/repositories/grove-roots";

describe("Grove Root relationship types", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: "root-id", error: null });
  });

  it("offers every supported public relationship with a distinct label", () => {
    expect(ROOT_TYPE_DETAILS.map((type) => type.value)).toEqual([
      "ancestral",
      "family",
      "birth",
      "union",
      "community",
    ]);
    expect(rootTypeLabel("union")).toBe("Union");
  });

  it.each<RootType>(["ancestral", "family", "birth", "union", "community"])(
    "passes the %s relationship to the trusted creation function",
    async (rootType) => {
      await createGroveRoot({
        groveId: "grove-id",
        treeId: "tree-id",
        inscriptionText: "MAITHE",
        rootType,
      });

      expect(rpc).toHaveBeenCalledWith(
        "create_grove_root",
        expect.objectContaining({ p_root_type: rootType }),
      );
    },
  );
});