/**
 * Opt-in live check against the public S33D backend, as `anon`, read-only.
 * Skipped unless TETOL_LIVE=1, so CI never depends on the network.
 *
 *   TETOL_LIVE=1 npx vitest run src/tetol-bridge/__tests__/tetolBridge.live.test.ts
 */
import process from "node:process";
import { describe, it, expect } from "vitest";
import { createBridge } from "..";

const live = process.env.TETOL_LIVE === "1";

describe.skipIf(!live)("TETOL bridge — live public read", () => {
  it("reads one real Ancient Friend and one real Staff", async () => {
    const { data } = createBridge();
    const [first] = await data.listAncientFriends({ limit: 1 });
    expect(first, "no public trees returned").toBeTruthy();

    const friend = await data.getAncientFriend(first.id);
    const staff = await data.getStaff("YEW");
    console.info(JSON.stringify({ friend, staff }, null, 2));

    expect(friend?.spatialAddress).toMatch(/^heartwood\/root-descent\/cavern\/friend\//);
    expect(staff?.spatialAddress).toBe("staff-room/staff/YEW");
  }, 30_000);
});
