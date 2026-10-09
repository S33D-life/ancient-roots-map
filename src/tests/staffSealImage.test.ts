import { describe, expect, it } from "vitest";
import { getStaffImageFromCode } from "@/components/tree-detail/TreeDetailSubComponents";

describe("offering seal thumbnails", () => {
  it("uses the canonical image mapping, including shortened asset names", () => {
    expect(getStaffImageFromCode("YEW-C1S52")).toBe("/images/staffs/yew.jpeg");
    expect(getStaffImageFromCode("CHERRY-C0S13")).toBe("/images/staffs/cher.jpeg");
    expect(getStaffImageFromCode("PRIVET-C0S13")).toBe("/images/staffs/priv.jpeg");
    expect(getStaffImageFromCode("willow-C1S04")).toBe("/images/staffs/wil.jpeg");
  });
  it("preserves an unknown seal label without requesting a fabricated species image", () => {
    expect(getStaffImageFromCode("S33D")).toBeNull();
    expect(getStaffImageFromCode("UNKNOWN-C1S01")).toBeNull();
    expect(getStaffImageFromCode("__proto__")).toBeNull();
    expect(getStaffImageFromCode("")).toBeNull();
  });
});
