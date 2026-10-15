import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getGridStaffs, spiralPositionLabel } from "@/utils/staffRoomData";

// The 36 Origin Staffs are numbered by Spiral position (YEW = 1). The contract's source order differs in 34 of 36
// positions (YEW is token 15), so no 2D surface may call a Spiral position a "Token" until a chain crosswalk exists.
describe("Staff Spiral numbering is never presented as an NFT token", () => {
  it("labels the 36 Origin Staffs by Spiral position and gives circle staffs no number", () => {
    const grid = getGridStaffs();
    expect(spiralPositionLabel(grid[0])).toBe("Spiral #1");
    expect(grid[0].code).toBe("YEW");
    expect(spiralPositionLabel(grid[35])).toBe("Spiral #36");
    expect(grid.slice(36).every((s) => spiralPositionLabel(s) === null)).toBe(true);
  });
  it("removes 'Token #' wording from the 2D Staff surfaces and holds the mismatched On-Chain viewer", () => {
    for (const f of ["src/pages/StaffDetailPage.tsx", "src/components/StaffRoomGallery.tsx", "src/components/staff/SpiralOfSpecies.tsx", "src/components/staff/StaffSpiralNavigator.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/Token #|label="Token"/);
    }
    expect(readFileSync("src/components/StaffRoomGallery.tsx", "utf8")).toContain("const SHOW_ONCHAIN_VIEWER = false;");
  });
});
