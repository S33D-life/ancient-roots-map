import { describe, it, expect } from "vitest";
import {
  buildCheckinPayload,
  CANOPY_PROOF_MAX_ACCURACY_M,
} from "@/lib/encounters/buildCheckinPayload";
import { seasonStage } from "@/lib/encounters/encounterSeason";

const BASE = { treeId: "t1", userId: "u1" };
const AT = new Date(2026, 4, 15); // May → "leaf"

describe("buildCheckinPayload — canopy_proof (stricter C2 formula)", () => {
  it("true when there is a fix and accuracy_m = 99 (< 100)", () => {
    const p = buildCheckinPayload({ ...BASE, lat: 51.5, lng: -0.1, accuracyM: 99 });
    expect(p.canopy_proof).toBe(true);
  });

  it("false when accuracy_m = 100 (boundary is strict <)", () => {
    const p = buildCheckinPayload({ ...BASE, lat: 51.5, lng: -0.1, accuracyM: 100 });
    expect(p.canopy_proof).toBe(false);
  });

  it("false when accuracy_m is null / missing", () => {
    expect(buildCheckinPayload({ ...BASE, lat: 51.5, lng: -0.1, accuracyM: null }).canopy_proof).toBe(false);
    expect(buildCheckinPayload({ ...BASE, lat: 51.5, lng: -0.1 }).canopy_proof).toBe(false);
  });

  it("false when there is no GPS fix even if an accuracy somehow arrives", () => {
    expect(buildCheckinPayload({ ...BASE, accuracyM: 5 }).canopy_proof).toBe(false);
    expect(CANOPY_PROOF_MAX_ACCURACY_M).toBe(100);
  });
});

describe("buildCheckinPayload — accuracy_m (TreeCheckinButton now stores it)", () => {
  it("passes through the measured accuracy", () => {
    expect(buildCheckinPayload({ ...BASE, lat: 1, lng: 2, accuracyM: 8 }).accuracy_m).toBe(8);
  });
  it("is null when not provided", () => {
    expect(buildCheckinPayload({ ...BASE }).accuracy_m).toBeNull();
  });
});

describe("buildCheckinPayload — checkin_method", () => {
  it("derives gps/manual from the fix by default", () => {
    expect(buildCheckinPayload({ ...BASE, lat: 1, lng: 2 }).checkin_method).toBe("gps");
    expect(buildCheckinPayload({ ...BASE }).checkin_method).toBe("manual");
  });
  it("honours an explicit override (TreeCheckinButton's GPS toggle)", () => {
    // toggle on but GPS failed (no fix) → still "gps", preserving prior Tree behaviour
    expect(buildCheckinPayload({ ...BASE, checkinMethod: "gps" }).checkin_method).toBe("gps");
  });
});

describe("buildCheckinPayload — privacy", () => {
  it("defaults to 'public' (prior default where the user didn't choose)", () => {
    expect(buildCheckinPayload({ ...BASE }).privacy).toBe("public");
  });
  it("passes through a user-selected value (TreeCheckinButton)", () => {
    expect(buildCheckinPayload({ ...BASE, privacy: "private" }).privacy).toBe("private");
  });
});

describe("buildCheckinPayload — season_stage comes from C1 seasonStage()", () => {
  it("matches seasonStage(at)", () => {
    expect(buildCheckinPayload({ ...BASE, at: AT }).season_stage).toBe(seasonStage(AT));
  });
});

describe("buildCheckinPayload — parity with prior inline payloads", () => {
  // QuickCheckinButton reference: { latitude, longitude, accuracy_m, season_stage,
  // checkin_method: lat?gps:manual, privacy:"public", canopy_proof: !!(lat && acc && acc<100) }
  it("QuickCheckinButton output is identical for realistic accuracies", () => {
    for (const accuracy of [5, 30, 99, 100, 101, null] as const) {
      const lat = 51.5, lng = -0.1;
      const p = buildCheckinPayload({ treeId: "t1", userId: "u1", lat, lng, accuracyM: accuracy, at: AT });
      const legacy = {
        tree_id: "t1",
        user_id: "u1",
        latitude: lat,
        longitude: lng,
        accuracy_m: accuracy,
        season_stage: seasonStage(AT),
        checkin_method: lat ? "gps" : "manual",
        privacy: "public",
        canopy_proof: !!(lat && accuracy && accuracy < 100),
      };
      expect(p).toEqual(legacy);
    }
  });

  // mapWishHandler reference: { tree_id, user_id, season_stage, checkin_method:"manual",
  // privacy:"public", canopy_proof:false } — equivalent row (explicit null coords == omission).
  it("mapWishHandler output is equivalent (no GPS)", () => {
    const p = buildCheckinPayload({ treeId: "t1", userId: "u1", at: AT });
    expect(p).toEqual({
      tree_id: "t1",
      user_id: "u1",
      latitude: null,
      longitude: null,
      accuracy_m: null,
      season_stage: seasonStage(AT),
      checkin_method: "manual",
      privacy: "public",
      canopy_proof: false,
    });
  });
});
